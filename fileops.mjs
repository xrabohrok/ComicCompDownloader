import * as stream from 'stream';
import { promisify } from 'util';
import axios from 'axios';
// import fs from fs
// const fs = require('fs')
import * as fs from 'fs';
import * as fsp from 'fs/promises';

const finished = promisify(stream.finished);

export async function downloadFile(fileUrl, outputLocationPath){
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {
    response.data.pipe(writer);
    return finished(writer); //this is a Promise
  });
}

export async function writeTextFile(dataArray, loc){
  return fsp.writeFile(loc, dataArray.join('\n'))
}

export function maybeMakeDir(dir){
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}