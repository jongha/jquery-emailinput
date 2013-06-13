# emailaddressinput.js
emailaddressinput.js is simple email address input control for Javascript.

## `.init(id, style, autoCompleteHandler)`
Initialize emailaddressinput control.

```Javascript
var eai_to = EmailAddressInput;
eai_to.init("pto", { id: "to"}, { handler: null, callback: null });
```
```Javascript
For Multiple control in one page.

var eai_to = EmailAddressInput;
var eai_cc = EmailAddressInput.clone();
var eai_bcc = EmailAddressInput.clone();

eai_to.init("pto", { id: "to"}, { handler: null, callback: null });
eai_cc.init("pcc", {id: "cc"}, { handler: null, callback: null });
eai_bcc.init("pbcc", {id: "bcc"}, { handler: null, callback: null });
```

## `.getAddresses()`
Return the entered the e-mail addresses. Returns are `Array()` data type.
```Javascript
eai_to.getAddresses();
...
eai_to.getAddresses().join(",");
```
