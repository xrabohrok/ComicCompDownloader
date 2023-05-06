var args = process.argv.slice(2)
// const round = parseInt(args.find(a => a.includes("round")).split("=")[1], 10)

var fighters = require("./allfighters.json")
var key = require("./apikey.json")

console.log(`Fighters: ${Object.keys(fighters).length}`)

var fighterLinks = Object.values(fighters).map(f => {
    
    var rounds = {}
    f.rounds.forEach((r,i) => {
        rounds[`${r}`] = f.link[i]
    });

    return {
        id: f.id,
        name: f.name,
        rounds,
        artists: f.artists,
        faction: f.faction[0]
    }
})

console.log(fighterLinks[0])