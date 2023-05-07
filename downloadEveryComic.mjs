var args = process.argv.slice(2)
const outputLoc = args.findIndex(a => a.includes("--output"))
var ouputBaseDir = "W4R"
if (outputLoc >= 0) {
    ouputBaseDir = args[outputLoc + 1]
}
const resumeIdIndex = args.findIndex(a => a.includes("--resumeId"))
var resumeId = -1
if(resumeIdIndex >= 0){
    console.log('continuing...')
    resumeId = parseInt(args[resumeIdIndex + 1], 10)
}
console.log(args)

import { readFile } from 'fs/promises';

const fighters = JSON.parse(
    await readFile(new URL('./allfighters.json', import.meta.url))
)

const apiKey = JSON.parse(
    await readFile(new URL('./apikey.json', import.meta.url))
)

import { isNotALink, isImgurLink, getGalleryHash } from "./imgur.mjs"
import { downloadFile, maybeMakeDir, writeTextFile } from './fileops.mjs';

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
maybeMakeDir(`./${ouputBaseDir}`)

//nuclear safety, delete to unleash hell
// fighterLinks = fighterLinks.slice(0, 10)
// console.log('only attempting 10 today :-)')

if(resumeId > -1){
    var continueIndex = fighterLinks.findIndex(fl => fl.id === resumeId)
    if( continueIndex > -1){
        console.log(`Found continue id (${resumeId}) at index ${continueIndex}, ${ (continueIndex/fighterLinks.length *100).toPrecision(1)}% in.`)
        fighterLinks = fighterLinks.slice(continueIndex-1)
    }
}

for (var fighter of fighterLinks) {
    maybeMakeDir(`./${ouputBaseDir}/${fighter.name}`)
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
            if (!result) continue;
            console.log(`${fighter.name} - Round ${roundNumber} - ${result.data.data.images.length} images to download`)
            const illegalChars = /\*|\\|\//ig
            var safeTitle = !result.data.data.title ? "No title" : result.data.data.title.replace(illegalChars, '')
            //Damn you pancake lord
            safeTitle = safeTitle.slice(0,150)
            const roundFolder = `${roundNumber}-${safeTitle}`
            comicBuffer.push(safeTitle)
            maybeMakeDir(`./${ouputBaseDir}/${fighter.name}/${roundFolder}`)
            for (var i = 0; i < result.data.data.images.length; i += 1) {

                var listing = result.data.data.images[i]
                comicBuffer.push(`Page ${i} -`)
                comicBuffer.push(`\t ${result.data.data.images[i].description == "null" || !result.data.data.images[i].description 
                    ? '--' : result.data.data.images[i].description}`)
                var extension = listing.type.split('\/')[1]
                downloadFile(listing.link, `./${ouputBaseDir}/${fighter.name}/${roundFolder}/${i}.${extension}`).catch(
                    (error) => {
                        if (error.response) {
                            errorBuffer.push[`${fighter.name} - ERROR - ${error.response.status}`]
                        }
                        errorBuffer.push[`${fighter.name} - ERROR - problem making request`]
                    }
                )
            }
            writeTextFile(comicBuffer, `./${ouputBaseDir}/${fighter.name}/${roundFolder}/comicMeta.txt`)
        }
        else {
            console.log('Not on imgur, skipping')
            errorBuffer.push(`skipped ${fighter.name} == Round : ${roundNumber} | ${context}`)
        }
    }
}

await writeTextFile(errorBuffer, `./${ouputBaseDir}/errors.txt`)
// process.exit(0)
