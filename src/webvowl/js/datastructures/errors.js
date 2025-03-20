
class ValueError extends Error {
    constructor(msg) {
        super(msg)
    }
}
class IndexError extends RangeError {
    constructor(msg) {
        super(msg)
    }
}

module.exports = {
    ValueError,
    IndexError
}