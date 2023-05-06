const imgrTest = /^(https?:\/\/)?imgur\.com\/.*\/.......$/im

const isNotALink = function(link) {
    return link.toLowerCase().includes("[no submission]") || link.trim() === "na"
}

const isImgurLink= function(input){
    return imgrTest.test(input)
}

const getGalleryHash = function(imgurLink){
    const imgurIDPart = /\/(a|gallery)\/.......$/i
    var parts = imgurLink.match(imgurIDPart)
    return parts[0].split("/")[2]
}

export{
    isNotALink,
    isImgurLink,
    getGalleryHash
}