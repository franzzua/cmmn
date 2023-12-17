import {EventEmitter} from "@cmmn/core";
import {Injectable} from "@cmmn/core";

@Injectable()
class Dependency{
    constructor(private service: EventEmitter<any>) {
    }
}

// function Injectable(options = null){
//     return function (original, context) {
//         return original;
//     }
// }