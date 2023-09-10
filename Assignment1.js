// JavaScript source code
'use strict';

var NUM = "NUM";
var FALSE = "FALSE";
var VARIABLE = "VARIABLE";
var PLUS = "PLUS";
var TIMES = "TIMES";
var LT = "LT";
var AND = "AND";
var NOT = "NOT";
var ITE = "ITE";

var ALLOPS = [NUM, FALSE, VARIABLE, PLUS, TIMES, LT, AND, NOT, ITE];

function str(obj) { return JSON.stringify(obj); }

//Constructor definitions for the different AST nodes.


/**************************************************
 ***********  AST node definitions *****************
 ****************************************************/

class Node {
    toString() {
        throw new Error("Unimplemented method: toString()");
    }

    interpret() {
        throw new Error("Unimplemented method: interpret()");
    }
}

class False extends Node {
    toString() {
        return "false";
    }

    interpret(envt) {
        return false;
    }
}


class Variable {
    constructor(name) {
        this.name = name;
    }

    toString() {
        return this.name;
    }

    interpret(envt) {
        return envt[this.name];
    }
}

class Num {
    constructor(val) {
        this.val = val;
    }

    toString() {
        return this.val.toString();
    }

    interpret(envt) {
        return this.val;
    }
}

class Plus {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }

    toString() {
        return "(" + this.left.toString() + "+" + this.right.toString() + ")";
    }


    interpret(envt) {
        return this.left.interpret(envt) + this.right.interpret(envt);
    }
}

class Times {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }

    toString() {
        return "(" + this.left.toString() + "*" + this.right.toString() + ")";
    }

    interpret(envt) {
        return this.left.interpret(envt) * this.right.interpret(envt);
    }
}

class Lt {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }

    toString() {
        return "(" + this.left.toString() + "<" + this.right.toString() + ")";
    }

    interpret(envt) {
        return this.left.interpret(envt) < this.right.interpret(envt);
    }
}

class And {
    constructor(left, right) {
        this.left = left;
        this.right = right;
    }


    toString() {
        return "(" + this.left.toString() + "&&" + this.right.toString() + ")";
    }

    interpret(envt) {
        return this.left.interpret(envt) && this.right.interpret(envt);
    }
}



class Not {
    constructor(left) {
        this.left = left;
    }

    toString() {
        return "(!" + this.left.toString() + ")";
    }

    interpret(envt) {
        return !this.left.interpret(envt);
    }
}


class Ite {

    constructor(c, t, f) {
        this.cond = c;
        this.tcase = t;
        this.fcase = f;
    }

    toString() {
        return "(if " + this.cond.toString() + " then " + this.tcase.toString() + " else " + this.fcase.toString() + ")";
    }

    interpret(envt) {
        if (this.cond.interpret(envt)) {
            return this.tcase.interpret(envt);
        } else {
            return this.fcase.interpret(envt);
        }
    }
}
//Some functions you may find useful:

function randInt(lb, ub) {
    var rf = Math.random();
    rf = rf * (ub - lb) + lb;
    return Math.floor(rf);
}


function writeToConsole(text) {
    var csl = document.getElementById("console");
    if (typeof text == "string") {
        csl.value += text + "\n";
    } else {
        csl.value += text.toString() + "\n";
    }
}

// expr_types maps expressions to their type signatures
// the type signature of an expression is a list of the types of its arguments followed by the type of the expression
let vars = ["x", "y"];
let consts = [4, 5];
let exprTypes = { FALSE: ["bool"], NUM: ["int"], VARIABLE: ["int"], PLUS: ["int", "int", "int"], TIMES: ["int", "int", "int"], LT: ["int", "int", "bool"], AND: ["bool", "bool", "bool"], NOT: ["bool", "bool"], ITE: ["bool", "int", "int", "int"] };;
let exprNodes = { FALSE: False, NUM: Num, VARIABLE: Variable, PLUS: Plus, TIMES: Times, LT: Lt, AND: And, NOT: Not, ITE: Ite };;

function exprNode(expr) {
    // if expr is in exprNodes
    if (expr in exprNodes) {
        return exprNodes[expr];
    }
    else {
        return expr;
    }
}
// for some reason the VAR key has to be VAR, not VR
function exprType(expr, vars, consts) {
    expr = expr[0];
    // if expr is in vars or consts
    if (vars.includes(expr) || consts.includes(expr)) {
        return ["int"];
    }
    else {
        return exprTypes[expr];
    }
}

function returnType(expr, vars, consts) {
    return exprType(expr, vars, consts).slice(-1)[0];
}

// initial plist is the list of all terminals, i.e. variables, constants, and false
// i.e. concatentation of vars, consts, and [FALSE]
// but with all elements wrapped in singleton arrays

function grow(plist, nonterminals, vars, consts) {
    // this function applies every nonterminal to every possible combination of arguments from plist
    // such that the type signature of the nonterminal matches the types of the arguments
    var next_level_plist = [];
    for (var i = 0; i < nonterminals.length; i++) {
        var nonterminal = nonterminals[i];
        var argtypes = exprTypes[nonterminal].slice(0, -1);
        var args = [];
        for (var j = 0; j < argtypes.length; j++) {
            args.push(plist.filter(x => returnType(x, vars, consts) == argtypes[j]));
        }
        const cartesianProduct = args.reduce((accumulator, currentArray) => {
            const newCombinations = [];
            accumulator.forEach(existingCombination => {
                currentArray.forEach(newValue => {
                    newCombinations.push(existingCombination.concat([newValue]));
                });
            });
            return newCombinations;
        }, [[]]);

        // Create next level productions by combining with the nonterminal
        cartesianProduct.forEach(combination => {
            next_level_plist.push([nonterminal, ...combination]);
        });
    }
    return plist.concat(next_level_plist);
}

function applyToConstructor(constructor, argArray) {
    var args = [null].concat(argArray);
    var factoryFunction = constructor.bind.apply(constructor, args);
    return new factoryFunction();
}

function tree_map(fn, arr) {
    if (Array.isArray(arr)) {
        return arr.map(item => tree_map(fn, item));
    } else {
        return fn(arr);
    }
}

function AST(expr) {
    return tree_map(x => exprNode(x), expr)
}

function compile(e) {
    if (Array.isArray(e)) {
        if (Object.values(exprNodes).includes(e[0])) {
            // apply the constructor to the rest of the elements of expr
            return applyToConstructor(e[0], compile(e.slice(1)));
        }
        else {
            if (e.length > 1) {
                return e.map(x => compile(x));
            }
            else {
                // if first element of expr is not a constructor, then it is a variable or constant
                // so we return the first element of expr
                return compile(e[0]);
            }
        }
    }
    else {
        return e
    }
}

function elimEquvalents(plist, inputoutputs) {
    let obsUniqs = {};
    for (var p of plist) {
        var ast = compile(AST(p));
        let outs = inputoutputs.map(x => ast.interpret(x));
        if (outs in obsUniqs) {
            continue;
        }
        else {
            obsUniqs[outs] = p;
        }
    }
    plist = Object.values(obsUniqs);
    return plist
}

// var foo = compile(AST(plist[30]));
// foo;
// console.log(foo.interpret({ x: 5, y: 10, _out: 5 }));

function isCorrect(p, inputoutputs) {
    var ast = compile(AST(p));
    let outs = inputoutputs.map(x => ast.interpret(x));
    // compare outs to _out
    for (var i = 0; i < outs.length; i++) {
        if (outs[i] != inputoutputs[i]._out) {
            return false;
        }
    }
    console.log(outs);
    return true; 
}

function bottomUp(globalBnd, intOps, boolOps, vars, consts, inputoutput) {
    var plist = vars.map(x => [VARIABLE, [x]]).concat(consts.map(x => [NUM, [x]])).concat([[FALSE]]);
    var nonterminals = [PLUS, TIMES, LT, AND, NOT, ITE];
    console.log(plist);
    for (var c = 0; c < globalBnd; c++) {
        console.log(c);
        plist = grow(plist, nonterminals, vars, consts);
        console.log(plist.length);
        plist = elimEquvalents(plist, inputoutput);
        console.log(plist.length);
        for (var n = 0; n < plist.length; n++) {
            var p = plist[n];
            if (isCorrect(p, inputoutput)) {
                return compile(AST(p));
            }
        }
        console.log(p);
    }
    return "FAIL";
    // plist = grow(plist, nonterminals);
    // console.log(plist.length);
    // plist = grow(plist, nonterminals); null;
    // console.log(plist.length);
    // console.log(plist.slice(-1)[0]);
}


// var correct_p = ["ITE", ["LT", ["VARIABLE", ["x"]], ["VARIABLE", ["y"]]], ["VARIABLE", ["x"]], ["VARIABLE", ["y"]]];
// isCorrect(correct_p, inputoutputs); 

// var rv = bottomUp(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
// var rv = bottomUp(2, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
// rv;

function get_arguments(nonterminal, plist, vars, consts, argtypes) {
    var args = [];
    var vars = vars.map(x => [VARIABLE, [x]]);
    var var_and_consts = vars.concat(consts.map(x => [NUM, [x]]));
    if (nonterminal == TIMES) {
        // Multiplications can only occur between variables and constants or between two variables
        args = [vars, var_and_consts];
    }
    else if (nonterminal == LT) {
        // Comparisons cannot include any arithmetic, only variables and constants
        args = [var_and_consts, var_and_consts];        
    }
    else {
        // Just get all the arguments of the correct type
        for (var j = 0; j < argtypes.length; j++) {
            args.push(plist.filter(x => returnType(x, vars, consts) == argtypes[j]));
        }
    }
    return args;
}
    

function growFaster(plist, nonterminals, vars, consts) {
    // this function applies every nonterminal to every possible combination of arguments from plist
    // such that the type signature of the nonterminal matches the types of the arguments
    var next_level_plist = [];
    for (var i = 0; i < nonterminals.length; i++) {
        var nonterminal = nonterminals[i];
        var argtypes = exprTypes[nonterminal].slice(0, -1);
        var args = get_arguments(nonterminal, plist, vars, consts, argtypes);
        const cartesianProduct = args.reduce((accumulator, currentArray) => {
            const newCombinations = [];
            accumulator.forEach(existingCombination => {
                currentArray.forEach(newValue => {
                    newCombinations.push(existingCombination.concat([newValue]));
                });
            });
            return newCombinations;
        }, [[]]);

        // Create next level productions by combining with the nonterminal
        cartesianProduct.forEach(combination => {
            next_level_plist.push([nonterminal, ...combination]);
        });
    }
    return plist.concat(next_level_plist);
}

function bottomUpFaster(globalBnd, intOps, boolOps, vars, consts, inputoutput) {
    var plist = vars.map(x => [VARIABLE, [x]]).concat(consts.map(x => [NUM, [x]])).concat([[FALSE]]);
    var nonterminals = [PLUS, TIMES, LT, AND, NOT, ITE];
    console.log(plist);
    for (var c = 0; c < globalBnd; c++) {
        console.log(c);
        plist = growFaster(plist, nonterminals, vars, consts);
        console.log(plist.length);
        plist = elimEquvalents(plist, inputoutput);
        console.log(plist.length);
        for (var n = 0; n < plist.length; n++) {
            var p = plist[n];
            if (isCorrect(p, inputoutput)) {
                return p;
            }
        }
        console.log(p);
    }
    return "FAIL";
}

function bottomUpFasterSTUN(globalBnd, intOps, boolOps, vars, consts, inputoutput) {
    var plist = vars.map(x => [VARIABLE, [x]]).concat(consts.map(x => [NUM, [x]])).concat([[FALSE]]);
    var nonterminals = [PLUS, TIMES, LT, AND, NOT, ITE];
    // first best-effort synthesis attempt
    // produce a program that works correctly on some inputs and incorrectly on others
    plist = growFaster(plist, nonterminals, vars, consts);
    plist = elimEquvalents(plist, inputoutput);
    // for each program in plist, get list of bools indicating whether it is correct on each input
    
    function get_correct_mask(ast, inputoutput) {
        var correct = [];
        for (var i = 0; i < inputoutput.length; i++) {
            var inpt = inputoutput[i];
            var out = ast.interpret(inpt);
            if (out == inpt._out) {
                correct.push(true);
            }
            else {
                correct.push(false);
            }
        }
        return correct;
    }

    function eval_all_programs(plist, inputoutput) {
        var all_p_correct = [];
        for (var n = 0; n < plist.length; n++) {
            var p = plist[n];
            var ast = compile(AST(p));
            var correct = get_correct_mask(ast, inputoutput);
            all_p_correct.push([p, correct]);
        }
        return all_p_correct;
    }

    function max_correct(all_p_correct, mask) {
        // find the program that is correct on the most inputs
        var max_correct = 0;
        var max_correct_p = [];
        var best_correct = [];
        for (var i = 0; i < all_p_correct.length; i++) {
            var correct = all_p_correct[i][1];
            // if mask is defined, only consider the inputs where mask is true
            if (mask != undefined) {
                var mask_correct = correct.filter((x, j) => mask[j] == true);
            }
            else {
                var mask_correct = correct;
            }
            var num_correct = mask_correct.filter(x => x == true).length;
            if (num_correct > max_correct) {
                max_correct = num_correct;
                max_correct_p = all_p_correct[i][0];
                best_correct = correct;
            }
        }
        return [max_correct_p, best_correct];
    }
    
    function coverage(collection) {
        if (collection.length == 0) {
            return false;
        }
        // reduce or of all the masks in the collection
        let masks = collection.map(x => x[1]);
        var cov = masks.reduce((a, b) => a.map((x, i) => x || b[i]));
        console.log(cov);
        return cov;
    }

    function unify(p1m1, p2m2, counter) {
        var [p1, m1] = p1m1;
        var [p2, m2] = p2m2;
        if (p1 == undefined) {
            return [p2, m2];
        }
        var cond_io = inputoutput;
        // iterate over m1
        for (var i = 0; i < m1.length; i++) {
            cond_io[i]._out = m1[i];
        }
        condition = bottomUpFaster(globalBnd, [], boolOps, vars, consts, cond_io);
        console.log(condition);
        var cov = coverage([p1m1, p2m2]);
        return [[ITE, [condition, p1, p2]], cov, counter];
    }

    function STUN(all_p_correct, collection, inputoutput, remaining_incorrect_inputs) {
        // if the programs collected so far cover all inputs, unify them
        if (remaining_incorrect_inputs.length == 0) {
            var [unified_p, all_true] = collection.reduce((acc, curr) => unify(acc, curr), [undefined, inputoutput.map(x => false)])
            return unified_p;
        }
        // otherwise, find the inputs on which they all are incorrect
        // and find the program that is correct on the most of those inputs
        // and add it to the collection of programs
        else {
            var mask = inputoutput.map(x => remaining_incorrect_inputs.includes(x));
            collection.push(max_correct(all_p_correct, mask));
            joint_correct = coverage(collection);
            var remaining_incorrect_inputs = [];
            for (var i = 0; i < joint_correct.length; i++) {
                if (joint_correct[i] == false) {
                    remaining_incorrect_inputs.push(inputoutput[i]);
                }
            }
            return STUN(all_p_correct, collection, inputoutput, remaining_incorrect_inputs);
        }
    }
    var all_p_correct = eval_all_programs(plist, inputoutput);
    var p = STUN(all_p_correct, [], inputoutput, inputoutput); 
    return p;
}

var rv = bottomUpFasterSTUN(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["a", "b", "c"], [0], [
    { a: 5, b: 10, c: 3, _out: 15 },
    { a: 8, b: 11, c: -1, _out: -11 },
    { a: 3, b: 6, c: 4, _out: 12 },
    { a: -3, b: 8, c: 4, _out: -12 },
    { a: -3, b: -8, c: 4, _out: 0 }
]);
console.log(compile(AST(rv)).toString());

// THIS CRASHES:
// var rv = bottomUpFaster(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["a", "b", "c"], [0], [
//     { a: 5, b: 10, c: 3, _out: 15 },
//     { a: 8, b: 11, c: -1, _out: -11 },
//     { a: 3, b: 6, c: 4, _out: 12 },
//     { a: -3, b: 8, c: 4, _out: -12 },
//     { a: -3, b: -8, c: 4, _out: 0 }
// ]);
// console.log(rv);
// console.log(compile(AST(rv)).toString());

// THIS CRASHES:
// var rv = bottomUpFasterSTUN(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["a", "b", "c"], [0], [
//     { a: 5, b: 10, c: 3, _out: 15 },
//     { a: 8, b: 11, c: -1, _out: -11 },
//     { a: 3, b: 6, c: 4, _out: 12 },
//     { a: -3, b: 8, c: 4, _out: -12 },
//     { a: -3, b: -8, c: -4, _out: 0 }
// ]);
// console.log(rv);

function tmp(a,b,c) {
    if (0 < c) {
        if (a<b) {
        // if ((a<b) && (0<c)) {
            return a*c;
        }
        else {
            return 0;
        }
    }
    else {
        return b*c;
    }
}

tmp(5, 10, 3);
tmp(8, 11, -1);
tmp(3, 6, 4);
tmp(-3, 8, 4);
tmp(-3, -8, 4);

function run1a1() {
    var rv = bottomUp(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
    writeToConsole("RESULT: " + compile(AST(rv)).toString());
}

function run1a2() {
    var rv = bottomUp(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [-1, 5], [
        { x: 10, y: 7, _out: 17 },
        { x: 4, y: 7, _out: -7 },
        { x: 10, y: 3, _out: 13 },
        { x: 1, y: -7, _out: -6 },
        { x: 1, y: 8, _out: -8 }
    ]);
    writeToConsole("RESULT: " + compile(AST(rv)).toString());

}


function run1b() {

    var rv = bottomUpFaster(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [-1, 5], [
        { x: 10, y: 7, _out: 17 },
        { x: 4, y: 7, _out: -7 },
        { x: 10, y: 3, _out: 13 },
        { x: 1, y: -7, _out: -6 },
        { x: 1, y: 8, _out: -8 }
    ]);
    writeToConsole("RESULT: " + compile(AST(rv)).toString());

}

function run1c() {

    var rv = bottomUpFaster(1, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["a", "b", "c"], [0], [
        { a: 5, b: 10, c: 3, _out: 15 },
        { a: 8, b: 11, c: -1, _out: -11 },
        { a: 3, b: 6, c: 4, _out: 12 },
        { a: -3, b: 8, c: 4, _out: -12 }
    ]);
    writeToConsole("RESULT: " + compile(AST(rv)).toString());

}




//Useful functions for exercise 2. 
//Not so much starter code, though.

function structured(inputoutputs) {
    return "NYI";
}


function run2() {
    var inpt = JSON.parse(document.getElementById("input2").value);
    //This is the data from which you will synthesize.
    writeToConsole("You need to implement this");
}


function genData() {
    //If you write a block of code in program1 that writes its output to a variable out,
    //and reads from variable x, this function will feed random inputs to that block of code
    //and write the input/output pairs to input2.
    var program = document.getElementById("program1").value
    function gd(x) {
        var out;
        eval(program);
        return out;
    }
    var textToIn = document.getElementById("input2");
    const BOUND = 500;
    const N = 10;
    textToIn.value = "[";
    for (var i = 0; i < N; ++i) {
        if (i != 0) { textToIn.textContent += ", "; }
        var inpt = randInt(0, BOUND);
        textToIn.value += "[" + inpt + ", " + gd(inpt) + "]";
        if (i != (N - 1)) {
            textToIn.value += ",";
        }
    }
    textToIn.value += "]";
}
