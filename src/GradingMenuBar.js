import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import LogoHomeNav from './LogoHomeNav.js';
import { saveGradedStudentWork, saveGradedStudentWorkToBlob} from './TeacherInteractiveGrader.js';
import { LightButton, HtmlButton } from './Button.js';
import { getPersistentState, getEphemeralState, saveToLocalStorageOrDrive } from './FreeMath.js';

var SET_TO_VIEW_GRADES = 'SET_TO_VIEW_GRADES';
var SET_TO_SIMILAR_DOC_CHECK = 'SET_TO_SIMILAR_DOC_CHECK';
var NAV_BACK_TO_GRADING = 'NAV_BACK_TO_GRADING';

var ASSIGNMENT_NAME = 'ASSIGNMENT_NAME';
var SET_ASSIGNMENT_NAME = 'SET_ASSIGNMENT_NAME';

var GOOGLE_ID = 'GOOGLE_ID';
var SET_GOOGLE_ID = 'SET_GOOGLE_ID';
// state for google drive auto-save
// action
var SET_GOOGLE_DRIVE_STATE = 'SET_GOOGLE_DRIVE_STATE';
// Property name and possible values
var GOOGLE_DRIVE_STATE = 'GOOGLE_DRIVE_STATE';
var SAVING = 'SAVING';
var ALL_SAVED = 'ALL_SAVED';
var DIRTY_WORKING_COPY = 'DIRTY_WORKING_COPY';
var ERROR_DOC_TOO_BIG = 'ERROR_DOC_TOO_BIG';
var PENDING_SAVES = 'PENDING_SAVES';

class GradingMenuBar extends React.Component {
    componentDidMount() {
        const saveCallback = function() {
            var persistentState = getPersistentState();
            var zip = saveGradedStudentWorkToBlob(persistentState);
            var content = zip.generate({type: "blob"});
            var googleId = getEphemeralState()[GOOGLE_ID];
            console.log("update in google drive:" + googleId);
            if (googleId) {
                window.updateFileWithBinaryContent (
                    persistentState[ASSIGNMENT_NAME] + '.zip',
                    content,
                    googleId,
                    'application/zip',
                    function() {
                        window.ephemeralStore.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                    }
                );
            } else {
                window.createFileWithBinaryContent (
                    persistentState[ASSIGNMENT_NAME] + '.zip',
                    content,
                    'application/zip',
                    function(response) {
                        window.store.dispatch({type : SET_GOOGLE_ID,
                            GOOGLE_ID: response.id,
                        });
                        window.ephemeralStore.dispatch(
                            { type : SET_GOOGLE_DRIVE_STATE,
                                GOOGLE_DRIVE_STATE : ALL_SAVED});
                    }
                );
            }
        }
        const saveToDrive = ReactDOM.findDOMNode(this.refs.saveToDrive)
        window.gapi.auth2.getAuthInstance().attachClickHandler(saveToDrive, {},
            saveCallback, function(){/* TODO - on sign in error*/})
    }

    render() {
        var browserIsIOS = false; ///iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        var assignmentName = this.props.value[ASSIGNMENT_NAME];
        if (typeof(assignmentName) === "undefined" || assignmentName == null) {
            assignmentName = "";
        }
        var saveStateMsg = '';
        var googleId = this.props.value[GOOGLE_ID];
        var saveState = this.props.value[GOOGLE_DRIVE_STATE];
        if (googleId) {
            if (saveState === ALL_SAVED) saveStateMsg = "Saved Grades and Feedback in Classroom";
            else if (saveState === SAVING) saveStateMsg = "Saving in Classroom...";
            else if (saveState === ERROR_DOC_TOO_BIG) saveStateMsg = "Error saving to Classroom";
        } else {
            if (saveState === ALL_SAVED) saveStateMsg = "Saved recovery doc in browser";
            else if (saveState === SAVING) saveStateMsg = "Saving recovery doc in browser...";
            else if (saveState === ERROR_DOC_TOO_BIG) saveStateMsg = "Too big to save recovery doc in browser";
        }
        if (this.props.value[PENDING_SAVES]) {
            //saveStateMsg += " (" + this.props.value[PENDING_SAVES] + ")";
        }
        return (
            <div className="menuBar">
                <div className="nav" style={{maxWidth:1200,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav />
                    <div className="navBarElms" style={{float: "right", verticalAlign:"top", lineHeight : 1}}>

                        <span className="save-state-message"
                               style={{ textOverflow: "ellipsis", overflow: "hidden",
                                       display: "inline-block", whiteSpace: "nowrap",
                                       marginLeft: "15px", marginRight: "15px",
                                       color: (saveState === ERROR_DOC_TOO_BIG ? "#FFAEAE" : "inherit")}}>
                            {saveStateMsg}
                        </span>
                        {googleId
                            ?
                                <span className="google-assignment-name"
                                        style={{ textOverflow: "ellipsis", overflow: "hidden",
                                               display: "inline-block", whiteSpace: "nowrap",
                                               marginLeft: "15px", marginRight: "15px"}}
                                          title={this.props.value[ASSIGNMENT_NAME]}>
                                        {this.props.value[ASSIGNMENT_NAME]}
                                </span>
                            : null}

                        {/* Don't show option to save on iOS*/}
                        {!browserIsIOS ?
                        (<span>
                            {googleId
                            ?
                                <span>
                                    <HtmlButton
                                        className="fm-button-light"
                                        title="Save feedback and grades to Google Classroom"
                                        onClick={function() {
                                            window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs to Classroom');
                                            saveToLocalStorageOrDrive(0);
                                        }}
                                        content={(
                                                <div style={{display: "inline-block"}}>
                                                    <div style={{float: "left", paddingTop: "4px"}}>
                                                        Save to Classroom&nbsp;
                                                    </div>
                                                     <img style={{paddingTop: "2px"}}
                                                            src="images/google_classroom_small.png"
                                                            alt="Google Classroom logo"
                                                            height="16px"/>
                                                </div>
                                        )} />&nbsp;&nbsp;&nbsp;
                                </span>
                            :
                                <span>
                                Assignment &nbsp;
                                <input type="text" id="assignment-name-text" size="20"
                                        name="assignment name"
                                        value={this.props.value[ASSIGNMENT_NAME]}
                                        onChange={
                                            function(evt) {
                                                window.store.dispatch(
                                                    { type : SET_ASSIGNMENT_NAME,
                                                        ASSIGNMENT_NAME : evt.target.value});
                                            }}
                                />
                                </span>
                        }
                        &nbsp;&nbsp;
                        <LightButton text="Save to Device" onClick={
                            function() {
                                window.ga('send', 'event', 'Actions', 'edit', 'Save Graded Docs');
                                saveGradedStudentWork(getPersistentState());
                            }
                        }/>&nbsp;&nbsp;&nbsp;
                        </span>) : null }

                        <LightButton text="Similar Docs" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'Open similar doc check');
                                window.store.dispatch({type : SET_TO_SIMILAR_DOC_CHECK});
                            }
                        }/>&nbsp;&nbsp;&nbsp;
                        <LightButton text="Grades" onClick={
                            function() {
                                window.location.hash = '';
                                document.body.scrollTop = document.documentElement.scrollTop = 0;
                                window.ga('send', 'event', 'Actions', 'edit', 'View Grades');
                                window.store.dispatch({type : SET_TO_VIEW_GRADES});
                            }
                        }/>&nbsp;&nbsp;
                    </div>
                </div>
            </div>
        );
    }
}

export class ModalWhileGradingMenuBar extends React.Component {
    render() {
        return (
            <div className="menuBar">
                <div className="nav" style={{width:1024,marginLeft:"auto", marginRight:"auto"}}>
                    <LogoHomeNav /> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <div style={{float:"left", verticalAlign:"top",
                                 marginTop:"5px", lineHeight : 1}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        <LightButton text="Back to Grading" onClick={
                            function() {window.store.dispatch({type : NAV_BACK_TO_GRADING})}
                        }/>
                    </div>
                </div>
            </div>
        );
    }
}

export default GradingMenuBar;
