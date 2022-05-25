import {fetch} from "node-fetch-polyfill";
export {Api} from "../src/api";
import {Request} from "../src/request";
Request.fetch = fetch('', {

});
export {Request};