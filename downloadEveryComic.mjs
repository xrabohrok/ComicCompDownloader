var args = process.argv.slice(2)
const outputLoc = args.findIndex(a => a.includes("--output"))
var ouputBaseDir = "W4R"
if (outputLoc >= 0) {
    ouputBaseDir = args[outputLoc + 1]
}
const resumeIdIndex = args.findIndex(a => a.includes("--resumeId"))
var resumeId = -1
if (resumeIdIndex >= 0) {
    console.log('continuing...')
    resumeId = parseInt(args[resumeIdIndex + 1], 10)
}

var mode = "rayuba"
const hnhindex = args.findIndex(a => a.includes("--hnh"))
if(hnhindex >= 0){
    console.log('pulling Hunters and Horrors')
    mode = 'hnh'
}


const findMissingFlag = args.findIndex(a => a.includes("--findMissing"))
const findMissing = findMissingFlag > -1
console.log(args)

import { readFile } from 'fs/promises';

var fighterLinks = []

if(mode === "rayuba"){
    const fighters = JSON.parse(
        await readFile(new URL('./allfighters.json', import.meta.url))
    )
    fighterLinks = Object.values(fighters).map(f => {

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
}
else if(mode === "hnh"){
    const rounds = JSON.parse(
        await readFile(new URL('./hnh-fighters.json', import.meta.url))
    )
    const fighters = Object.keys(rounds).flatMap(l => {
        return rounds[l].map(f => {return {...f, round: l}})
    })
    var count = 0
    var fighterListing = Object.values(fighters).flatMap(f => {
        return [
            [{
                fighter: f.hunter,
                link: f.hunter_link,
                faction: "hunter",
                round: f.round
            },
            {
                fighter: f.horror,
                link: f.horror_link,
                faction: "horror",
                round: f.round
            }]
        ]
    })
    var fighterMap = {}
    fighterListing.forEach(l => {
        console.log(l)
        if(!(l.fighter in fighterMap)){
            count += 1
            fighterMap[l] = {
                id: count,
                name: l.fighter,
                rounds: [l.round],
                links: [l.link],
                artists: "",
                faction: l.faction,
                context: ["fight"]
            }
        }else{
            fighterMap[l].rounds.push(l.round)
            fighterMap[l].links.push(l.link)    
            fighterMap[l].context.push("fight")
        }
    })
    fighterLinks = Object.values( fighterMap)


}

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


// console.log(fighterLinks[0])

var errorBuffer = []
maybeMakeDir(`./${ouputBaseDir}`)

console.log(`Fighters: ${fighterLinks.length}`)

//nuclear safety, delete to unleash hell

fighterLinks = fighterLinks.slice(0, 10)
console.log('only attempting 10 today :-)')
console.log(fighterLinks[0])
process.exit()

if (resumeId > -1) {
    var continueIndex = fighterLinks.findIndex(fl => fl.id === resumeId)
    if (continueIndex > -1) {
        console.log(`Found continue id (${resumeId}) at index ${continueIndex}, ${(continueIndex / fighterLinks.length * 100).toPrecision(3)}% in.`)
        fighterLinks = fighterLinks.slice(continueIndex - 1)
    }
}

try {
    for (var fighter of fighterLinks) {
        if (!findMissing) maybeMakeDir(`./${ouputBaseDir}/${fighter.name}`)
        for (var roundIndex = 0; roundIndex < fighter.rounds.length; roundIndex += 1) {
            var link = fighter.links[roundIndex]
            var roundNumber = fighter.rounds[roundIndex]
            var context = fighter.context[roundIndex]
            if (!isNotALink(link) && isImgurLink(link)) {
                var downloadSet = []
                var comicBuffer = []
                comicBuffer.push(`${fighter.name} == Round : ${roundNumber} | ${context}`)
                var imgurHash = getGalleryHash(link)
                var result = await axiosInst.get(`/album/${imgurHash}`)
                    .catch(error => {
                        if (error.response) {
                            const erMsg = `${fighter.name} - Round ${roundNumber} - ${imgurHash} - ERROR - ${error.response.status}`
                            errorBuffer.push(erMsg)
                            console.log(erMsg)
                        }
                        else {
                            const erMsg = `${fighter.name} - ERROR - problem making request`
                            console.log(erMsg)
                            errorBuffer.push(erMsg)
                        }
                    })
                if (!result) continue;
                if (findMissing) continue;
                console.log(`${fighter.name} - Round ${roundNumber} - ${result.data.data.images.length} images to download`)
                const illegalChars = /\*|\\|\//ig
                var safeTitle = !result.data.data.title ? "No title" : result.data.data.title.replace(illegalChars, '')
                //Damn you pancake lord
                safeTitle = safeTitle.slice(0, 150)
                const roundFolder = `${roundNumber}-${safeTitle}`
                comicBuffer.push(safeTitle)
                maybeMakeDir(`./${ouputBaseDir}/${fighter.name}/${roundFolder}`)
                for (var i = 0; i < result.data.data.images.length; i += 1) {

                    var listing = result.data.data.images[i]
                    comicBuffer.push(`Page ${i} -`)
                    comicBuffer.push(`\t ${result.data.data.images[i].description == "null" || !result.data.data.images[i].description
                        ? '--' : result.data.data.images[i].description}`)
                    var extension = listing.type.split('\/')[1]
                    downloadSet.push(downloadFile(listing.link, `./${ouputBaseDir}/${fighter.name}/${roundFolder}/${i}.${extension}`).catch(
                        (error) => {
                            if (error.response) {
                                errorBuffer.push[`${fighter.name} - ERROR - ${error.response.status}`]
                            }else{
                                errorBuffer.push[`${fighter.name} - ERROR - problem making request`]
                            }
                        }
                    ))
                }
                await Promise.allSettled(downloadSet)
                writeTextFile(comicBuffer, `./${ouputBaseDir}/${fighter.name}/${roundFolder}/comicMeta.txt`)
            }
            else {
                const skipMessage = `${fighter.id} | skipped ${fighter.name} == Round : ${roundNumber} | ${context} : Not Imgur`
                console.log(skipMessage)
                errorBuffer.push(skipMessage)
            }
        }
    }
} catch (error) {
    errorBuffer.push(JSON.stringify(error))
} finally {
    await writeTextFile(errorBuffer, `./${ouputBaseDir}/errors.txt`)
}

// process.exit(0)
