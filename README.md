# jQuery-emailinput
[![Build Status](https://travis-ci.org/jongha/jquery-emailinput.png?branch=master)](https://travis-ci.org/jongha/jquery-emailinput)
[![Coverage Status](https://coveralls.io/repos/jongha/jquery-emailinput/badge.png)](https://coveralls.io/r/jongha/jquery-emailinput)
[![Dependency Status](https://gemnasium.com/jongha/jquery-emailinput.png)](https://gemnasium.com/jongha/jquery-emailinput)

jQuery-emailinput is email address input control for jQuery. This is jQuery plugin. This is required when creating an web mail service such as hotmail and gmail. It supports validation of email address.

## Screenshot

![Screenshot](https://raw.github.com/jongha/jquery-emailinput/master/demo/screenshot.png)

## Usage

Initialize

```
$('#target').emailinput();
```

Change internally control id.

```
$('#target').emailinput( { id: 'changed id' );
```

Retrieve the values.

```
$('#target').val();
```

Manage only valid email address only.

```
$('#target').emailinput( { onlyValidValue: true ); // default: true
```

Manage only valid email address only.

```
$('#target').emailinput( { onlyValidValue: true ); // default: true
```

Change delimiters of retrieve the value.

```
$('#target').emailinput( { delim: ';' ); // default: ','
```

## License

jQuery-emailinput is available under the terms of the MIT License.
