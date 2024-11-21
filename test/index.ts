import {EventEmitter} from "@cmmn/core";
import {singleton} from "@cmmn/core";
import { inject } from "@cmmn/core";

@singleton()
class Dependency{
    @inject(EventEmitter) private service!: EventEmitter<any>;
    constructor() {
    }
}

// function Injectable(options = null){
//     return function (original, context) {
//         return original;
//     }
// }