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
import { downloadFile, maybeMakeDir } from './fileops.mjs';

import axios from "axios"


var axiosInst = axios.create({
    baseURL: 'https://api.imgur.com/3/', headers: {
        "Authorization": `Client-ID ${apiKey.client_id}`
    }
})

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

var errorBuffer = []

///////////////////////////////////////////////
//get gallery info
var fighter = fighterLinks.find((f) => f.id === 180)

// for (var round = 0; round < fighter.rounds.length; round += 1) {
    var link = fighter.links[0]
    if (!isNotALink(link) && isImgurLink(link)) {
        var comicBuffer = []
        var imgurHash = getGalleryHash(link)
        var result = await axiosInst.get(`/album/${imgurHash}`)
            .catch(error => {
                if (error.response) {
                    console.log("error:")
                    console.log(error.response.status)
                    console.log(error.response)
                    errorBuffer.push[`${fighter.name} - ERROR - ${error.response.status}`]
                }
                else {
                    errorBuffer.push[`${fighter.name} - ERROR - problem making request`]
                }
            })
        //if(!result) continue;
        console.log(`${fighter.name} - ${result.data.data.images.length} images to download`)
        for (var i = 0; i < result.data.data.images.length; i += 1) {
            var listing = result.data.data.images[i]
            var extension = listing.type.split('\/')[1]
            downloadFile(listing.link, `./${i}.${extension}`).catch(
                (error) => {
                    if (error.response) {
                        errorBuffer.push[`${fighter.name} - ERROR - ${error.response.status}`]
                    }
                    errorBuffer.push[`${fighter.name} - ERROR - problem making request`]
                }
            )
        }
    }
    else {
        console.log('Not on imgur, skipping')
    }
// }
