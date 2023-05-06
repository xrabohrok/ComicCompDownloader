import * as stream from 'stream';
import { promisify } from 'util';
import axios from 'axios';
// import fs from fs
// const fs = require('fs')
import * as fs from 'fs';

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

export function maybeMakeDir(dir){
    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir)
    }
}