// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../../../../core/resource.mjs";
import * as IssuersAPI from "./issuers.mjs";
import { Issuers, } from "./issuers.mjs";
import * as RulesAPI from "./rules/rules.mjs";
import { Rules, } from "./rules/rules.mjs";
export class Federation extends APIResource {
    constructor() {
        super(...arguments);
        this.issuers = new IssuersAPI.Issuers(this._client);
        this.rules = new RulesAPI.Rules(this._client);
    }
}
Federation.Issuers = Issuers;
Federation.Rules = Rules;
//# sourceMappingURL=federation.mjs.map