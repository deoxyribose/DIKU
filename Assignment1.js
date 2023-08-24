// JavaScript source code
'use strict';

var NUM = "NUM";
var FALSE = "FALSE";
var VR = "VAR";
var PLUS = "PLUS";
var TIMES = "TIMES";
var LT = "LT";
var AND = "AND";
var NOT = "NOT";
var ITE = "ITE";

var ALLOPS = [NUM, FALSE, VR, PLUS, TIMES, LT, AND, NOT, ITE];

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


class Var {
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

var io = [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }];

// foo = new Var("y").interpret({ x: 5, y: 10, _out: 5 });
foo = new Plus(new Num(3), new Num(4));
foo.interpret({ x: 5, y: 10, _out: 5 });
tmp = foo.typeSignature(); 

function bottomUp(globalBnd, intOps, boolOps, vars, consts, inputoutputs) {
    // expr_types maps expressions to their type signatures
    // the type signature of an expression is a list of the types of its arguments followed by the type of the expression
    exprTypes = {FALSE: ["bool"], NUM: ["int"], VAR: ["int"], PLUS: ["int", "int", "int"], TIMES: ["int", "int", "int"], LT: ["int", "int", "bool"], AND: ["bool", "bool", "bool"], NOT: ["bool", "bool"], ITE: ["bool", "int", "int", "int"]};;

    var plist = [];
    function get_init_plist(vars, consts) {
        for (i = 0; i < vars.length; i++) {
            plist.push(new Var(vars[i]));
        }
        for (i = 0; i < consts.length; i++) {
            plist.push(new Num(consts[i]));
        }
        plist.push(new False());
    }
    get_init_plist(vars, consts);
    console.log(plist);

    nonterminals = [Plus, Times, Lt, And, Not, Ite];
    // var bnd = 0;
    // while bnd < 3 {

    function grow(plist, nonterminals) {
        for (i = 0; i < nonterminals.length; i++) {
            var nonterminal = nonterminals[i];
            console.log(nonterminal)
            var argtypes = exprTypes[nonterminal].slice(0, -1);
            console.log(argtypes)
            var returntype = exprTypes[nonterminal].slice(-1)[0];
            console.log(returntype)

            var args = argtypes.map(function (argtype) {
                    if (argtype == "int") {
                        // filter plist for expressions whose typeSignature's last element is int
                        args.push(plist.filter(function (x) { return exprTypes[x].slice(-1)[0] == "int"; }));
                    } else if (argtype == "bool") {
                        args.push(plist.filter(function (x) { return exprTypes[x].slice(-1)[0] == "bool"; }));
                    }
                }
            )

            console.log(args);
        }
    }
    grow(plist, nonterminals);
}

var rv = bottomUp(3, [VR, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);


function bottomUpFaster(globalBnd, intOps, boolOps, vars, consts, inputoutput) {

    return "NYI";
}


function run1a1() {

    var rv = bottomUp(3, [VR, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
    writeToConsole("RESULT: " + rv.toString());

}


function run1a2() {

    var rv = bottomUp(3, [VR, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [-1, 5], [
        { x: 10, y: 7, _out: 17 },
        { x: 4, y: 7, _out: -7 },
        { x: 10, y: 3, _out: 13 },
        { x: 1, y: -7, _out: -6 },
        { x: 1, y: 8, _out: -8 }
    ]);
    writeToConsole("RESULT: " + rv.toString());

}


function run1b() {

    var rv = bottomUpFaster(3, [VR, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [-1, 5], [
        { x: 10, y: 7, _out: 17 },
        { x: 4, y: 7, _out: -7 },
        { x: 10, y: 3, _out: 13 },
        { x: 1, y: -7, _out: -6 },
        { x: 1, y: 8, _out: -8 }
    ]);
    writeToConsole("RESULT: " + rv.toString());

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
