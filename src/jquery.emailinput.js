(function ($) {
    $.fn.emailinput = function(options) {

        var settings = $.extend({
            id: 'eai_input', // overlay input text id
            onlyValidValue: true, // set input text valid email address only
            delim: ',' // input text value delimiter
        }, options);

        options = $.extend(settings, options);

        var getValidation = function(address) {
            var reg = /^([A-Za-z0-9_\-\.\+])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            return reg.test(address);
        };

        var setAddresses = function(obj) {
            var addresses = [];
            obj.find('span' + (options.onlyValidValue ? '.ei_valid' : '')).each(function() { addresses.push($(this).data('address')); });
            obj.data('ref').val(addresses.join(options.delim));            
        };
        
        var addAddress = function(obj) {
            var val = $.trim(obj.val());
            if(val !== '') {
                var validate = getValidation(val);
                var wrapper = obj.parent();
                
                wrapper.append(
                    $('<span></span>')
                        .data('address', val)
                        .html(val)
                        .addClass('ei_box')
                        .addClass(validate ? 'ei_valid' : 'ei_invalid')
                        .bind('click', function() { // click to delete
                            $(this).remove();
                            setAddresses(wrapper);
                        })
                    );
                    
                setAddresses(wrapper);
            }
            return obj;
        };
        
        var removeLastAddress = function(obj) {
            var wrapper = obj.parent();
            wrapper.find('span:last').last().remove();
            setAddresses(wrapper);
        };

        this.each(function() {
            var input = $('<div></div>')
                .addClass($(this).attr('class'))
                .data('ref', $(this));
                
            input.bind('click', function() {
                var inputOverlay = $('#' + options.id);
                if(inputOverlay.length === 0) {
                    inputOverlay = $('<input />')
                        .attr({ 'id': options.id, 'attr': 'text' })
                        .addClass('ei_box')
                        .css('border', 'none')
                        .bind('keydown', function(e) {
                            switch(e.keyCode) {
                                case 13: // enter
                                    addAddress($(this)).val('').remove();
                                    input.click();
                                    break;

                                case 27: // esc
                                    addAddress($(this).val('')).remove();
                                    break;

                                case 8: // backspace
                                case 46: // del
                                    if($(this).val() === '') {
                                        removeLastAddress($(this));
                                    }
                                    break;
                            }
                        })
                        .bind('blur', function() {
                            addAddress($(this)).remove();
                        });

                    $(this).append(inputOverlay);
                }
                setTimeout(function() { inputOverlay.focus(); }, 5); // for IE bugs
            });

            $(this).hide();
            $(this).parent().after().append(input);
        });

        return this;
    };
}(jQuery));