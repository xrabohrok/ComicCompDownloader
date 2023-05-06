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
        faction: f.faction[0],
        context: f.context
    }
})

// console.log(fighterLinks[0])

var errorBuffer = []

///////////////////////////////////////////////
//get gallery info
var fighter = fighterLinks.find((f) => f.id === 180)

maybeMakeDir(`./${fighter.name}`)
for (var roundIndex = 0; roundIndex < fighter.rounds.length; roundIndex += 1) {
    var link = fighter.links[roundIndex]
    var roundNumber = fighter.rounds[roundIndex]
    var context = fighter.context[roundIndex]
    if (!isNotALink(link) && isImgurLink(link)) {
        var comicBuffer = []
        comicBuffer.push(`${fighter.name} == Round : ${roundNumber} | ${context}`)
        var imgurHash = getGalleryHash(link)
        var result = await axiosInst.get(`/album/${imgurHash}`)
            .catch(error => {
                if (error.response) {
                    const erMsg = `${fighter.name} - ERROR - ${error.response.status}`
                    errorBuffer.push[erMsg]
                    console.error(erMsg)
                }
                else {
                    const erMsg = `${fighter.name} - ERROR - problem making request`
                    console.error(erMsg)
                    errorBuffer.push[erMsg]
                }
            })
        if(!result) continue;
        console.log(`${fighter.name} - ${result.data.data.images.length} images to download`)
        maybeMakeDir(`./${fighter.name}/${roundNumber}`)
        for (var i = 0; i < result.data.data.images.length; i += 1) {

            var listing = result.data.data.images[i]
            var extension = listing.type.split('\/')[1]
            downloadFile(listing.link, `./${fighter.name}/${roundNumber}/${i}.${extension}`).catch(
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
        errorBuffer.push(`skipped ${fighter.name} == Round : ${roundNumber} | ${context}`)

    }
}
