var args = process.argv.slice(2)
// const round = parseInt(args.find(a => a.includes("round")).split("=")[1], 10)

import { readFile } from 'fs/promises';

const fighters = JSON.parse(
    await readFile(new URL('./allfighters.json', import.meta.url))
)

const apiKey = JSON.parse(
    await readFile(new URL('./apikey.json', import.meta.url))
)

import { isNotALink, isImgurLink, getGalleryHash } from "./imgur.mjs"
import axios from "axios"


var axiosInst = axios.create({ baseURL:'https://api.imgur.com/3/', headers:{
    "Authorization": `Client-ID ${apiKey.client_id}`
}} )

console.log(`Fighters: ${Object.keys(fighters).length}`)

/////////////////////////////////////////////////
// reduce fighters to the stuff I care about
var fighterLinks = Object.values(fighters).map(f => {
    
    return {
        id: f.id,
        name: f.name,
        rounds: f.rounds,
        links: f.link,
        artists: f.artists,
        faction: f.faction[0]
    }
})

// console.log(fighterLinks[0])

///////////////////////////////////////////////
//get gallery info
var fighter = fighterLinks.find((f)=>f.id === 180)

var link = fighter.links[0]
if(!isNotALink(link) && isImgurLink(link)){
    var imgurHash = getGalleryHash(link)
    var result = await axiosInst.get(`/album/${imgurHash}`)
        .catch(error => {
            if(error.response){
                console.log("error:")
                console.log(error.response.status)
                console.log(error.response)
            }
        })
    console.log('result:')
    console.log(result.data.data.title)
    console.log(result.data.data.images[0].link)
}
else{
    console.log('Not on imgur, skipping')
}
