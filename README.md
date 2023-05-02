# Vscode Scope Jump

> jump/select to start/end of scope on hover.

the extension gets all the file available scopes and add `jump` / `select` buttons to the hover widget

![demo](https://user-images.githubusercontent.com/7388088/235799158-823841bf-c08c-4b61-8146-ead81510dd79.png)

## Notes

the buttons only show

>- at the start/end of the scope
>- on the scopes that span more than one line
>- if the file doesn't have any provided scopes to navigate to, nothing will show up in the hover widget

## Limitations

not all languages provider include comment block inside the scope range, ex.

| language | range              | selectionRange |
| -------- | ------------------ | -------------- |
| ts       | method only        | method only    |
| php      | method + doc block | method only    |

so in-cases like this, hovering over comment blocks in some languages will show the buttons, but in others, it won't.
