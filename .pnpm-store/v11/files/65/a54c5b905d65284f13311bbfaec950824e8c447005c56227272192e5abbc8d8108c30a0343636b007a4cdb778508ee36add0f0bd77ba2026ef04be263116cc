import { Command } from "./command";
export function makeBuilder(common, service, name, ep) {
    return function makeCommand(added, plugins, op, $, smithyContext = {}) {
        const epMerged = Object.assign({}, common, added);
        return Command.classBuilder()
            .ep(epMerged)
            .m(function (CommandCtor, clientStack, config, options) {
            const list = plugins.call(this, CommandCtor, clientStack, config, options);
            list.unshift(ep(config, CommandCtor.getEndpointParameterInstructions()));
            return list;
        })
            .s(service, op, smithyContext)
            .n(name, op.charAt(0).toUpperCase() + op.slice(1) + "Command")
            .sc($)
            .build();
    };
}
