import {decorators, Component, property} from "@cmmn/uhtml";

@component()
export class $Name extends Component {

    @property()
    private property!: any;

    get State() {
        return this.property;
    }
}
