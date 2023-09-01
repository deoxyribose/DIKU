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

function bottomUp(globalBnd, intOps, boolOps, vars, consts, inputoutputs) {
    // expr_types maps expressions to their type signatures
    // the type signature of an expression is a list of the types of its arguments followed by the type of the expression
    var exprNodes = { FALSE: False, NUM: Num, VARIABLE: Variable, PLUS: Plus, TIMES: Times, LT: Lt, AND: And, NOT: Not, ITE: Ite };;
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
    var exprTypes = { FALSE: ["bool"], NUM: ["int"], VARIABLE: ["int"], PLUS: ["int", "int", "int"], TIMES: ["int", "int", "int"], LT: ["int", "int", "bool"], AND: ["bool", "bool", "bool"], NOT: ["bool", "bool"], ITE: ["bool", "int", "int", "int"] };;
    function exprType(expr) {
        expr = expr[0];
        // if expr is in vars or consts
        if (vars.includes(expr) || consts.includes(expr)) {
            return ["int"];
        }
        else {
            return exprTypes[expr];
        }
    }

    function returnType(expr) {
        return exprType(expr).slice(-1)[0];
    }

    // initial plist is the list of all terminals, i.e. variables, constants, and false
    // i.e. concatentation of vars, consts, and [FALSE]
    // but with all elements wrapped in singleton arrays
    var plist = vars.map(x => [VARIABLE, [x]]).concat(consts.map(x => [NUM, [x]])).concat([[FALSE]]);
    var nonterminals = [PLUS, TIMES, LT, AND, NOT, ITE];

    function grow(plist, nonterminals) {
        //     // this function applies every nonterminal to every possible combination of arguments from plist
        //     // such that the type signature of the nonterminal matches the types of the arguments
        var next_level_plist = [];
        for (i = 0; i < nonterminals.length; i++) {
            var nonterminal = nonterminals[i];
            var argtypes = exprTypes[nonterminal].slice(0, -1);
            var args = [];
            for (j = 0; j < argtypes.length; j++) {
                args.push(plist.filter(x => returnType(x) == argtypes[j]));
            }
            // console.log(args);
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


    // function elimEquvalents(plist, inputoutputs) {
    //     // for each inputoutput, for each expression in plist,  interpret the plist expression with the inputoutput
    //     // if the output is not in outputs, then push it to outputs
    //     // if the output is in outputs, then remove the expression from plist
    //     for (i = 0; i < inputoutputs.length; i++) {
    //         var outputs = [];
    //         var envt = inputoutputs[i];
    //         for (j = 0; j < plist.length; j++) {
    //             var expr = plist[j];
    //             var output = compile(AST(expr)).interpret(envt);
    //             console.log(output);
    //             if (outputs.includes(output)) {
    //                 // remove expr from plist
    //                 plist.splice(j, 1);
    //                 j--;
    //                 // break
    //             }
    //             else {
    //                 outputs.push(output);
    //             }
    //             console.log(outputs);
    //         }
    //     }
    //     return plist;
    // }

    function elimEquvalents(plist, inputoutputs) {
        let obsUniqs = {};
        for (p of plist) {
            ast = compile(AST(p));
            console.log(ast);
            let outs = inputoutputs.map(x => ast.interpret(x));
            obsUniqs[outs] = p;
        }
        plist = Object.values(obsUniqs);
        return plist
    }

    // var foo = compile(AST(plist[30]));
    // foo;
    // console.log(foo.interpret({ x: 5, y: 10, _out: 5 }));

    function isCorrect(p, inputoutputs) {
        for (i = 0; i < inputoutputs.length; i++) {
            var envt = inputoutputs[i];
            var output = compile(AST(p)).interpret(envt);
            console.log(output);
            if (output != envt._out) {
                return false;
            }
        }
        return true;
    }
    console.log(plist);
    for (c = 0; c < globalBnd; c++) {
        console.log(c);
        plist = grow(plist, nonterminals);
        console.log(plist.length);
        plist = elimEquvalents(plist, inputoutputs);
        console.log(plist.length);
        for (n = 0; n < plist.length; n++) {
            var p = plist[n];
            if (isCorrect(p, inputoutputs)) {
                return AST(p);
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


// correct_p = ["ITE", ["LT", ["VARIABLE", ["x"]], ["VARIABLE", ["y"]]], ["VARIABLE", ["x"]], ["VARIABLE", ["y"]]];
// isCorrect(correct_p, inputoutputs);

// var rv = bottomUp(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
var rv = bottomUp(2, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
rv;

function bottomUpFaster(globalBnd, intOps, boolOps, vars, consts, inputoutput) {

    return "NYI";
}


function run1a1() {

    var rv = bottomUp(3, [VARIABLE, NUM, PLUS, TIMES, ITE], [AND, NOT, LT, FALSE], ["x", "y"], [4, 5], [{ x: 5, y: 10, _out: 5 }, { x: 8, y: 3, _out: 3 }]);
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
