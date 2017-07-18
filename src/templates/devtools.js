// @name         ${name}
// @version      ${version}
// @description  ${description}
// @author       ${author}

var addScript=function(a){var b=document.createElement("script");b.src=a,document.getElementsByTagName("head")[0].appendChild(b)};
var scripts = [${externalDependencies}];
var addedCount = 0;
var scriptAddInterval = setInterval(function() {
    if(addedCount === scripts.length) {
        clearInterval(scriptAddInterval);
    } else {
        addScript(scripts[addedCount++]);
    }
}, 200);

setTimeout(function(){
${versionForJs}
${content}
}, 1000);