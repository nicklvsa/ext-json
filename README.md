# Ext-JSON

### This is small extension preprocessor to add additional features to JSON

#### Operators:
- `{{}}`: place an interpolated value
- `>>`: declare a static value with no interpolation allowed within its declaration

#### Examples:

```json
{
    ">>name": "Nick",
    ">>job": "software",
    "some_var": "value",
    "example": {
        "hello": "hello {{name}}",
        "foo": "bar"
    },
    "full": "{{name}} works in {{job}}"
}
```

#### Notes:
- Ext JSON supports multiple input files / split json inputs