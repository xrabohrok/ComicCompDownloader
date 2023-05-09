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

const derive_cubari_link = function(link) {
    //https://cubari.moe/read/imgur/2t0kUUs/1/1/
  
    const cubariLinkFormat = /^https:\/\/cubari\.moe\/read\/imgur\/......./i
    if (!cubariLinkFormat.test(link)) return link
    const imgurId = /\/\w\w\w\w\w\w\w/i
    var index = link.match(imgurId)[0].slice(1)
    return `https://imgur.com/a/${index}`
  }


export{
    isNotALink,
    isImgurLink,
    getGalleryHash,
    derive_cubari_link
}