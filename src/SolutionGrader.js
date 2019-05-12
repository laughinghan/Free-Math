import React from 'react';
import createReactClass from 'create-react-class';
import './App.css';
import TeX from './TeX.js';

var STUDENT_FILE = 'STUDENT_FILE';

var SCORE = "SCORE";
var FEEDBACK = "FEEDBACK";

// teacher grade page model properties
var CONTENT = "CONTENT";

// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE, SOLUTION_INDEX
var GRADE_SINGLE_SOLUTION = "GRADE_SINGLE_SOLUTION";
// action properties
// PROBLEM_NUMBER, SOLUTION_CLASS_INDEX, SCORE
var GRADE_CLASS_OF_SOLUTIONS = "GRADE_CLASS_OF_SOLUTIONS";
// action properties: MODE (JUST_UNGRADED | ALL)
var JUST_UNGRADED = "JUST_UNGRADED"
var ALL = "ALL";

var HIGHLIGHT_STEP = 'HIGHLIGHT_STEP';

var SET_PROBLEM_FEEDBACK = "SET_PROBLEM_FEEDBACK";
var STEPS = 'STEPS';
var STEP_KEY = 'STEP_KEY';
var SUCCESS = 'SUCCESS';
var ERROR = 'ERROR';
var HIGHLIGHT = 'HIGHLIGHT';

// CSS constants
var RED = '#FF99CC';
var GREEN = '#2cff72';

var SET_PROBLEM_POSSIBLE_POINTS = "SET_PROBLEM_POSSIBLE_POINTS";
var POSSIBLE_POINTS = "POSSIBLE_POINTS";

var OLD_POSSIBLE_POINTS = "OLD_POSSIBLE_POINTS";

function singleSolutionReducer(state, action) {
    if (action.type === GRADE_SINGLE_SOLUTION) {
        // currently no validation here
        return { ...state,
        SCORE : action[SCORE] };
    } else if (action.type === HIGHLIGHT_STEP) {
        var oldHighlight = state[STEPS][action[STEP_KEY]][HIGHLIGHT];
        var newHighlight;
        if (oldHighlight === undefined)
            newHighlight = ERROR;
        else if (oldHighlight === ERROR)
            newHighlight = SUCCESS;
        else if (oldHighlight === SUCCESS)
            newHighlight = undefined;

        var newState = { ...state,
            STEPS : [
                ...state[STEPS].slice(0, action[STEP_KEY]),
                { ...state[STEPS][action[STEP_KEY]], HIGHLIGHT : newHighlight},
                ...state[STEPS].slice(action[STEP_KEY] + 1)
            ]
        };
        return newState;
    } else if (action.type === SET_PROBLEM_FEEDBACK) {
        return { ...state,
        FEEDBACK : action[FEEDBACK] };
    } else if (action.type === SET_PROBLEM_POSSIBLE_POINTS) {
        if (Number(state[SCORE]) > 0) {
            var newScore = Math.round( (Number(state[SCORE])/Number(action[OLD_POSSIBLE_POINTS])) * Number(action[POSSIBLE_POINTS]));
            return { ...state,
                     SCORE : newScore };
        } else {
            return state;
        }
    } else {
        return state;
    }
}

const SolutionGrader = createReactClass({
    setScore: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : evt.target.value, SOLUTION_INDEX : studentSolutionIndex});
    },
    fullPoints: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : GRADE_SINGLE_SOLUTION, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : this.props.possiblePoints, SOLUTION_INDEX : studentSolutionIndex});
    },
    applyScoreToAll: function(evt) {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;
        // TODO - check if any unique grades have been applied to student solutions other than this one in
        // this solution class
        // if not, just send the action through, otherwise prompt a warning about losing grades
        // this is to prevent loss of work if a teacher already gave specific grades to a
        // few students, it is necessary to have this feature to allow re-grading a whole group
        // which is not possible with "apply to ungraded"
        // TODO - inside of this component I shouldn't really know about all of the other solutions
        // in this group, as this is just rendering a single problems grader. Could pass down callback
        // that doesn't expose the data completely but just allows this check to be made

        window.store.dispatch({ type : GRADE_CLASS_OF_SOLUTIONS, MODE : ALL, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : data[SCORE]});
    },
    applyScoreToUngraded: function(evt) {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber;
        var solutionClassIndex = this.props.solutionClassIndex;
        window.store.dispatch({ type : GRADE_CLASS_OF_SOLUTIONS, MODE : JUST_UNGRADED, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, SCORE : data[SCORE]});
    },
    setFeedback: function(evt) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : evt.target.value, SOLUTION_INDEX : studentSolutionIndex});
    },
    setQuickFeedback: function(text) {
        var problemNumber = this.props.problemNumber
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        window.store.dispatch({ type : SET_PROBLEM_FEEDBACK, PROBLEM_NUMBER : problemNumber,
                         SOLUTION_CLASS_INDEX : solutionClassIndex, FEEDBACK : text, SOLUTION_INDEX : studentSolutionIndex});
    },
    render: function() {
        var data = this.props.solutionGradeInfo;
        var problemNumber = this.props.problemNumber
        var possiblePoints = this.props.possiblePoints;
        var solutionClassIndex = this.props.solutionClassIndex;
        var studentSolutionIndex = this.props.id;
        //var showStudentName = this.props.showStudentName;
        var showStudentName = true;
        var correctness;
        // TODO - look up react/redux best practices with stuff like this
        // keep possiblePoints as a string in the model to allow it to be
        // empty string while editing the text
        var score = Number(data[SCORE]);
        var feedback = data[FEEDBACK];
        // TODO - replace with classNames library - https://github.com/JedWatson/classnames
        // or computed inline styles, sharing through explicit imports/passing down
        var possiblePointsNum = Number(possiblePoints);
        // TODO - consider if empty string is the best way to convey "not yet scored"/complete
        if (data[SCORE] === "") {
            correctness = "answer-complete";
        } else if (score === 0) {
            correctness = "answer-incorrect";
        } else if (score >= possiblePointsNum) {
            correctness = "answer-correct";
        } else {
            correctness = "answer-partially-correct";
        }
        var classes = "student-work " + correctness;
        return (
            <div className={classes} style={{float:"left"}}> {/*<!-- container for nav an equation list --> */}
                <div style={{visibility: (data[SCORE] === "") ? "visible" : "hidden"}}>
                    <small><span style={{color:"#545454"}}>Complete - Full Credit</span><br /></small>
                </div>
                <span> {showStudentName ? data[STUDENT_FILE] : "" }</span>
                {/* TODO - I need teachers to be able to edit the score, including deleting down to empty string, so they
                           can write a new score. If I add validation when setting the value in the reducer the field won't be editable.
                           Look up react best pratices for this, right now I'll assume I should attach another event here to ensure
                           that the field contains a number when focus is lost
                */}
                <p>Score <input type="text" className="problem-grade-input" value={data[SCORE]} onChange={this.setScore}
                          /> out of {possiblePoints}
                        <br />
                        <input type="submit" value="Full points" onClick={this.fullPoints}/>
                        <input type="submit" name="apply score to all" value="Apply to ungraded" onClick={this.applyScoreToUngraded}/>
                        <input type="submit" name="apply score to all" value="Apply to all" onClick={this.applyScoreToAll}/>
                </p>
                <p>Feedback &nbsp; &nbsp;
                <br />
                <input type="submit" value="Show work" onClick={function() {this.setQuickFeedback("Show your complete work.");}.bind(this)}/>
                <input type="submit" value="Simple mistake" onClick={function() {this.setQuickFeedback("Review your work for a simple mistake.")}.bind(this)}/>
                <br />
                <input type="submit" value="Let's talk" onClick={function() {this.setQuickFeedback("Let's chat about this next class.");}.bind(this)}/>
                <input type="submit" value="Not simplified" onClick={function() {this.setQuickFeedback("Be sure to simplify completely.");}.bind(this)}/>
                <input type="submit" value="Sig figs" onClick={function() {this.setQuickFeedback("Incorrect significant figures.");}.bind(this)}/>
                </p>

                <div><textarea placeholder="Click a button for quick feedback or type custom feedback here." cols="30" rows="4" onChange={this.setFeedback} value={feedback}></textarea>
                </div>
                <div style={{float:"left"}} className="equation-list">
                    <br/>
                    {
                        data[STEPS].map(function(step, stepIndex) {
                        var stepStyle = {};
                        if (step[HIGHLIGHT] === ERROR) stepStyle = {backgroundColor : RED}
                        else if (step[HIGHLIGHT] === SUCCESS) stepStyle = {backgroundColor : GREEN}

                        return (
                            <div style={{marginTop:"10px"}} key={stepIndex + ' ' + step[HIGHLIGHT]}>
                                <div className="student-step-grader" style={{display: "inline-block"}}>
                                <TeX style={stepStyle} onClick={function() {
                                    window.store.dispatch({ type : HIGHLIGHT_STEP, PROBLEM_NUMBER : problemNumber,
                                                    SOLUTION_CLASS_INDEX : solutionClassIndex,
                                                    SOLUTION_INDEX : studentSolutionIndex,
                                                    STEP_KEY : stepIndex});
                                    }}>{typeof(step[CONTENT]) === 'string' ? step[CONTENT] : "\\text{corruption occured}"}</TeX>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
});

export { SolutionGrader as default, singleSolutionReducer};
