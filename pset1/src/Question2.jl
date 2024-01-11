
using Random

function lastKDigits(n, k)
    # returns the last k digits of n, as a string
    # pads with 0s if necessary
    s = string(n)
    if length(s) < k
        s = "0"^(k - length(s)) * s
    end
    return s[end-k+1:end]
end

struct LKDTerm
    k::Int64
    augend::Int64
end

LKDProgram = Tuple{LKDTerm,LKDTerm,LKDTerm,LKDTerm}

function interpretLKDTerm(term::LKDTerm, x::Int64)
    return lastKDigits(term.augend + x, term.k)
end

function interpretLKDProgram(program::LKDProgram, x::Int64)
    return interpretLKDTerm(program[1], x) *
           interpretLKDTerm(program[2], x) *
           interpretLKDTerm(program[3], x) *
           interpretLKDTerm(program[4], x)
end

example_lkd = (Pset1.LKDTerm(2, 3), Pset1.LKDTerm(3, 537), Pset1.LKDTerm(4, 82), Pset1.LKDTerm(5, 87))

function sampleLKDProgram(seed)
    Random.seed!(seed)
    terms = []
    for i in 1:4
        k = rand(2:5)
        augend = rand(1:100_000)
        push!(terms, LKDTerm(k, augend % 10^k))
    end
    return tuple(terms...)
end

function positive_modulus(x, y)
    # returns x % y, but always positive
    return (x % y + y) % y
end


function possible_breaks(output)
    n = length(string(output))
    breaks = []
    for i in 2:5
        for ii in 2:5
            for iii in 2:5
                for iv in 2:5
                    if i + ii + iii + iv == n
                        push!(breaks, (i, ii, iii, iv))
                    end
                end
            end
        end
    end
    return breaks
end

function solve_given_breaks(breaks, input, output)
    out_str = string(output)
    indices = cumsum(breaks)
    b_output = (out_str[1:indices[1]], out_str[indices[1]+1:indices[2]], out_str[indices[2]+1:indices[3]], out_str[indices[3]+1:indices[4]])
    holes = []
    for (i,b) in enumerate(breaks)
        current_b_output = b_output[i]
        b_out = parse(Int64, current_b_output)
        while input > b_out
            current_b_output = "1" * current_b_output
            b_out = parse(Int64, current_b_output)
        end
        hole = positive_modulus(b_out - input, 10^b)
        push!(holes, hole)
    end
    return holes
end
 

function structured(inputoutputs::Vector{Tuple{Int64,String}})::LKDProgram
    # synthesizes an LKD program that matches the given input/output pairs
    # inputoutputs is a vector of (input, output) pairs
    # get possible breaks (they are the same for all inputoutputs)
    possible_breaks_list = possible_breaks(inputoutputs[1][2])
    for breaks in possible_breaks_list
        input = inputoutputs[1][1]
        output = inputoutputs[1][2]
        prev_holes = solve_given_breaks(breaks, input, output)
        for (i, inputoutput) in enumerate(inputoutputs[2:end])
            input = inputoutput[1]
            output = inputoutput[2]
            holes = solve_given_breaks(breaks, input, output)
            if holes != prev_holes
                possible_breaks_list = possible_breaks_list[2:end]
                break
            end
            prev_holes = holes
            if i == length(inputoutputs) - 1
                return (LKDTerm(breaks[1], holes[1]), LKDTerm(breaks[2], holes[2]), LKDTerm(breaks[3], holes[3]), LKDTerm(breaks[4], holes[4]))
            end
        end
    end
end
