function parse(cookie) {
    let result = {};
    let values = cookie.split(";");
    for( value of values ) {
        value = value.trim().split('=');
        if(value.length == 2) result[value[0]] = value[1];
    }
    return result;
}

module.exports = parse;