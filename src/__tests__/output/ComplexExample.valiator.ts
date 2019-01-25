import {inspect} from 'util';
import Ajv = require('ajv');
import {Context} from 'koa';
import {MyEnum, TypeA, TypeB, RequestA, RequestB} from '../../ComplexExample';
export const ajv = new Ajv({allErrors: true, coerceTypes: false});

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

export {MyEnum, TypeA, TypeB, RequestA, RequestB};
export const Schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    MyEnum: {
      enum: [0, 1, 2],
      type: 'number',
    },
    RequestA: {
      properties: {
        body: {
          $ref: '#/definitions/TypeB',
        },
        params: {
          properties: {
            e: {
              $ref: '#/definitions/MyEnum',
            },
          },
          required: ['e'],
          type: 'object',
        },
        query: {
          $ref: '#/definitions/TypeA',
        },
      },
      required: ['body', 'params', 'query'],
      type: 'object',
    },
    RequestB: {
      properties: {
        query: {
          $ref: '#/definitions/TypeA',
        },
      },
      required: ['query'],
      type: 'object',
    },
    TypeA: {
      properties: {
        id: {
          type: 'number',
        },
        value: {
          type: 'string',
        },
      },
      required: ['id', 'value'],
      type: 'object',
    },
    TypeB: {
      properties: {
        id: {
          type: 'number',
        },
        value: {
          format: 'date-time',
          type: 'string',
        },
      },
      required: ['id', 'value'],
      type: 'object',
    },
  },
};
ajv.addSchema(Schema, 'Schema');
export function validateKoaRequest(
  typeName: 'RequestA',
): (
  ctx: Context,
) => {
  params: RequestA['params'];
  query: RequestA['query'];
  body: RequestA['body'];
};
export function validateKoaRequest(
  typeName: 'RequestB',
): (
  ctx: Context,
) => {
  params: unknown;
  query: RequestB['query'];
  body: unknown;
};
export function validateKoaRequest(
  typeName: string,
): (
  ctx: Context,
) => {
  params: unknown;
  query: unknown;
  body: unknown;
};
export function validateKoaRequest(
  typeName: string,
): (
  ctx: Context,
) => {
  params: any;
  query: any;
  body: any;
} {
  const params = ajv.getSchema(
    `Schema#/definitions/${typeName}/properties/params`,
  );
  const query = ajv.getSchema(
    `Schema#/definitions/${typeName}/properties/query`,
  );
  const body = ajv.getSchema(`Schema#/definitions/${typeName}/properties/body`);
  const validate = (prop: string, validator: any, ctx: Context): any => {
    const data = (ctx as any)[prop];
    if (validator) {
      const valid = validator(data);

      if (!valid) {
        ctx.throw(
          400,
          'Invalid request: ' +
            ajv.errorsText(validator.errors, {dataVar: prop}) +
            '\n\n' +
            inspect({params: ctx.params, query: ctx.query, body: ctx.body}),
        );
      }
    }
    return data;
  };
  return ctx => {
    return {
      params: validate('params', params, ctx),
      query: validate('query', query, ctx),
      body: validate('body', body, ctx),
    };
  };
}
export function validate(typeName: 'MyEnum'): (value: unknown) => MyEnum;
export function validate(typeName: 'TypeA'): (value: unknown) => TypeA;
export function validate(typeName: 'TypeB'): (value: unknown) => TypeB;
export function validate(typeName: 'RequestA'): (value: unknown) => RequestA;
export function validate(typeName: 'RequestB'): (value: unknown) => RequestB;
export function validate(typeName: string): (value: unknown) => any {
  const validator: any = ajv.getSchema(`Schema#/definitions/${typeName}`);
  return (value: unknown): any => {
    if (!validator) {
      throw new Error(
        `No validator defined for Schema#/definitions/${typeName}`,
      );
    }

    const valid = validator(value);

    if (!valid) {
      throw new Error(
        'Invalid ' +
          typeName +
          ': ' +
          ajv.errorsText(validator.errors, {dataVar: typeName}),
      );
    }

    return value as any;
  };
}