import { createRule } from '../../utils/create-rule';
import { ensureTemplateParser } from '../../utils/ensure-template-parser';
import {
  isBindingPipe,
  isForLoopBlock,
  isPropertyRead,
  type CallNode,
  type ExpressionNode,
  type IfBlockNode,
} from '../../utils/template-ast';
import {
  EMPTY_RESOURCE_STATES,
  describeMissingStates,
  isStateMethod,
  missingStates,
  withStateMethod,
  type ResourceStates,
} from './resource-states';

export const RULE_NAME = 'require-async-states';

export interface RequireAsyncStatesOptions {
  readonly asyncPipe?: boolean;
}

const VALUE_METHOD = 'value';
const TEMPLATE_RECEIVERS = new Set(['ImplicitReceiver', 'ThisReceiver']);

export function resourcePath(node: ExpressionNode): string | undefined {
  const names: string[] = [];
  let current = node;
  while (isPropertyRead(current)) {
    names.unshift(current.name);
    current = current.receiver;
  }
  return names.length > 0 && TEMPLATE_RECEIVERS.has(current.type) ? names.join('.') : undefined;
}

function isForLoopCollection(call: CallNode): boolean {
  const wrapper = call.parent;
  return isForLoopBlock(wrapper?.parent) && wrapper.parent.expression === wrapper;
}

function isForLoopWithoutEmpty(call: CallNode): boolean {
  return isForLoopCollection(call) && isForLoopBlock(call.parent?.parent) && call.parent.parent.empty === null;
}

function isLengthRead(call: CallNode): boolean {
  const parent = call.parent;
  return isPropertyRead(parent) && parent.name === 'length' && parent.receiver === call;
}

function isAsyncIfWithoutElse(node: IfBlockNode): boolean {
  const [first] = node.branches;
  return node.branches.length === 1 && isBindingPipe(first?.expression?.ast) && first.expression.ast.name === 'async';
}

export const requireAsyncStates = createRule<[RequireAsyncStatesOptions], 'missingStates' | 'asyncWithoutElse'>({
  name: RULE_NAME,
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require loading, error and empty states where async data is shown',
    },
    messages: {
      missingStates: '`{{ resource }}.value()` is shown without these states: {{ states }}. Add {{ hints }}.',
      asyncWithoutElse:
        'The `async` pipe result is shown without an `@else` branch, so the screen is empty while it loads. Add `@else` with a loading state.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          asyncPipe: {
            type: 'boolean',
            description: 'Also require an `@else` branch for `@if (data$ | async)`.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ asyncPipe: false }],
  create(context, [options]) {
    ensureTemplateParser(context);
    const statesByResource = new Map<string, ResourceStates>();
    const firstValueCalls = new Map<string, CallNode>();

    function update(resource: string, change: (states: ResourceStates) => ResourceStates): void {
      statesByResource.set(resource, change(statesByResource.get(resource) ?? EMPTY_RESOURCE_STATES));
    }

    function trackValueCall(resource: string, call: CallNode): void {
      if (!firstValueCalls.has(resource)) {
        firstValueCalls.set(resource, call);
      }
      const isIteratedWithoutEmpty = isForLoopWithoutEmpty(call);
      const isLengthChecked = isLengthRead(call);
      update(resource, (states) => ({
        ...states,
        isIteratedWithoutEmpty: states.isIteratedWithoutEmpty || isIteratedWithoutEmpty,
        isLengthChecked: states.isLengthChecked || isLengthChecked,
      }));
    }

    return {
      Call(node: CallNode) {
        if (!isPropertyRead(node.receiver)) {
          return;
        }
        const method = node.receiver.name;
        const resource = resourcePath(node.receiver.receiver);
        if (resource === undefined) {
          return;
        }
        if (method === VALUE_METHOD) {
          trackValueCall(resource, node);
        } else if (isStateMethod(method)) {
          update(resource, (states) => withStateMethod(states, method));
        }
      },
      IfBlock(node: IfBlockNode) {
        if (options.asyncPipe === true && isAsyncIfWithoutElse(node)) {
          context.report({ loc: node.loc, messageId: 'asyncWithoutElse' });
        }
      },
      'Program:exit'() {
        for (const [resource, call] of firstValueCalls) {
          const missing = missingStates(statesByResource.get(resource) ?? EMPTY_RESOURCE_STATES);
          if (missing.length > 0) {
            context.report({
              loc: call.loc,
              messageId: 'missingStates',
              data: { resource, ...describeMissingStates(resource, missing) },
            });
          }
        }
      },
    };
  },
});
