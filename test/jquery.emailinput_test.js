(function($) {
    test('One address', function() {
        $('#case1').emailinput();
        equal($('#case1').val(), 'user1@domain.com');
    });

    test('Two addresses', function() {
        $('#case2').emailinput();
        equal($('#case2').val(), 'user1@domain.com,user2@domain.com');
    });

    test('Three addresses', function() {
        $('#case3').emailinput();
        equal($('#case3').val(), 'user1@domain.com,user2@domain.com,user3@domain.com');
    });

    test('One address, Changed delimiter', function() {
        $('#case4').emailinput({ delim: '|' });
        equal($('#case4').val(), 'user1@domain.com');
    });

    test('Two addresses, Changed delimiter', function() {
        $('#case5').emailinput({ onlyValidValue: true, delim: '|' });
        equal($('#case5').val(), 'user1@domain.com|user2@domain.com');
    });

    test('Two addresses, Inlucde invalid value', function() {
        $('#case6').emailinput({ onlyValidValue: false });
        equal($('#case6').val(), 'user1@domain.com,user2@domain.com,wrong@user');
    });
}(jQuery));