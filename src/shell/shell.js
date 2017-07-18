// hide existing body while things are loading
document.body = document.createElement("body");
document.body.innerHTML = "<div><h2>Loading...</h2></div>";
// remove existing css so it doesn't conflict
for(var i=0;i<document.styleSheets.length;i++){document.styleSheets[i].disabled=true;}

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = [${bin/combined.css}].join('');
document.getElementsByTagName('head')[0].appendChild(style);

var external = document.createElement('link');
external.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css';
external.rel = "stylesheet";
document.getElementsByTagName('head')[0].appendChild(external);

${src/utils/utils.js}
${src/page/page.js}

${bin/combined.html}

    var page = new Page();
    page.load();

    ko.applyBindings(page);