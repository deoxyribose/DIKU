# using Distributed
# using DataStructures

# addprocs(12)

# function grow(plist::Vector{Shape})::Vector{Shape}
#     res::Vector{Shape} = []
#     # Question 1a
#     for i in 1:length(plist)
#         push!(res, plist[i])
#         push!(res, Mirror(plist[i]))
#         for j in (i + 1):length(plist)
#             push!(res, SIntersection(plist[i], plist[j]))
#             push!(res, SUnion(plist[i], plist[j]))
#         end
#     end
#     return res
# end

include("Interpreter.jl")

function grow(plist::Vector{Shape})::Vector{Shape}
    res::Vector{Shape} = []
    # Question 1a
    for p in plist
        push!(res, p)
        push!(res, Mirror(p))
        for p_ in plist
            push!(res, SIntersection(p, p_))
            push!(res, SUnion(p, p_))
        end
    end
    return res
end

function synthesize(in_x::Vector{Float64}, in_y::Vector{Float64}, out::Vector{Bool})::Shape
    # synthesize a shape that fits the given examples
    # in_x, in_y, out are vectors of the same length
    @assert(length(in_x) == length(in_y) == length(out))
    # in_x, in_y are coordinates in the range [0, MAX_COORD]
    @assert(all(0 .<= in_x .<= MAX_COORD))
    @assert(all(0 .<= in_y .<= MAX_COORD))
    # out is a boolean vector
    new_x = [1.0, 1, 8, 8, 4]
    new_y = [1.0, 8, 1, 8, 4]

    # Question 1b
    plist = all_terminal_shapes()
    while true
        @show(length(plist))
        # plist = elim_equivalents(plist, vcat(in_x, in_y), vcat(in_y, in_x))
        plist = elim_equivalents(plist, vcat(in_x, new_x), vcat(in_y, new_y))
        #plist = elim_equivalents(plist, new_x, new_y)
        @show(length(plist))
        for p in plist
            if is_correct(p, in_x, in_y, out)
                return p
            end
        end
        plist = grow(plist)
    end
    return make_circle(make_coord(5, 5), 5)
end

function elim_equivalents(plist::Vector{Shape}, in_x::Vector{Float64}, in_y::Vector{Float64})::Vector{Shape}
    elim_dict = Dict()
    for p in plist
        out = interpret(p, in_x, in_y)
        if !haskey(elim_dict, out)
            elim_dict[out] = p
        end
    end
    return collect(values(elim_dict))
end

function is_correct(p::Shape, in_x::Vector{Float64}, in_y::Vector{Float64}, out::Vector{Bool})::Bool
    return interpret(p, in_x, in_y) == out
end

function all_coordinates()::Vector{Coordinate}
    return [make_coord(x, y) for y in 0:MAX_COORD for x in 0:MAX_COORD]
end

function all_terminal_shapes()::Vector{Shape}
    res::Vector{Shape} = []
    for f in [make_rect, make_triangle]
        res = vcat(res, [f(a, b)
                         for a in all_coordinates() for b in all_coordinates()
                         if below_and_left_of(a, b)])
    end
    res = vcat(res, [make_circle(a, b) for a in all_coordinates() for b in 1:MAX_COORD])
    return res
end