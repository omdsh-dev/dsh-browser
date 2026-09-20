export class BinaryDecisionDiagram {
    nodes;
    root;
    conditions;
    results;
    constructor(bdd, root, conditions, results) {
        this.nodes = bdd;
        this.root = root;
        this.conditions = conditions;
        this.results = results;
    }
    static from(bdd, root, conditions, results) {
        return new BinaryDecisionDiagram(bdd, root, conditions, results);
    }
}
