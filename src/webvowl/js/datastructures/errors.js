
export class ValueError extends Error {
    constructor(msg) {
        super(msg)
    }
}
export class IndexError extends RangeError {
    constructor(msg) {
        super(msg)
    }
}