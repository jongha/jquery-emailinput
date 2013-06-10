/*jslint nomen: true, white: true, browser: true, vars: true, plusplus: true, bitwise: true, devel: true */

var BLASS = BLASS || {};
BLASS.EmailAddressInput = {
    _inputTable: null,                          // object 생성을 위한 객에 id
    _tableObj: null,                            // object가 최초에 생성되는 객체
    _inputDiv: null,                            // 전체 컨트롤을 포괄 div
    _virtualAddressInput: null,                 // 가상으로 생성되는 input box
    _inputStyle: null,                          // input box 스타일
    _inputRuler: null,                          // input box 사이즈 계산을 위한 가상의 div
    _addressBoxUl: null,                        // address box
    _addressBoxList: null,                      // li 객체 리스트 (index 1부터 실제 데이터, 0은 텍스트 박스용)
    _addressBoxId: 0,                           // 아이디 인덱스
    _addressBoxIdPrefix: "__BLASS_EMAILINPUT_", // 동적생성 아이디 prefix
    _autoCompleteHandler: null,
    _autoCompleteCallback: null,
    _autoCompleteDiv: null,
    _autoCompleteData: null,                    // 자동완성 데이터
    _autoCompleteResult: null,                  // 자동완성 결과
    //_autoCompleteCache: null,                   // 자동완성 캐시
    _autoCompleteLast: null,                    // 마지막 체크 데이터
    _selectedAutoCompleteIndex: -1,             // 선택한 자동완성 데이터 인덱스
    _selectedAutoCompleteProcess: true,         // 자동완성 진행 상태,
    _growSize: 0,
    _checkInputInterval: 250,                   // 한글 체크 타이머 간격(ms)
    _checkInput: false,                         // 입력 체크
    _checkInputCounter: 3,                      // 입력 체크 카운터
    _checkInputBuffer: null,                    // 입력 데이트 체크를 위한 버퍼
    _existCSS: false,                           // 여러 컨트롤 한페이지에 로드할경우 CSS한번만 구현하기위한 싱글톤
    init: function (inputTable, inputStyle, autoCompleteHandler) {
        "use strict";
        
        if (inputTable) { this._inputTable = inputTable; }
        if (this._inputTable) { this._tableObj = document.getElementById(this._inputTable); }
        if (autoCompleteHandler) {
            if (autoCompleteHandler.handler) { this._autoCompleteHandler = autoCompleteHandler.handler; }
            if (autoCompleteHandler.callback) { this._autoCompleteCallback = autoCompleteHandler.callback; }
        }

        this._inputStyle = {
            border: (inputStyle && inputStyle.border) ? inputStyle.border : "solid 1px #b5b5b5",
            backgroundColor: (inputStyle && inputStyle.backgroundColor) ? inputStyle.backgroundColor : "#ffffff",
            width: (inputStyle && inputStyle.width) ? inputStyle.width : "100%",
            fontSize: (inputStyle && inputStyle.fontSize) ? inputStyle.fontSize : "12px",
            id: (inputStyle && inputStyle.id) ? inputStyle.id : ""
        };

        this._addressBoxList = [];
        this._createCSS();
        this._createInput();
    },
    clone: function (obj, recursive) {
        "use strict";
        
        if (!recursive && !obj) { obj = this; }
        if (obj === null || typeof (obj) !== 'object') { return obj; }

        var newObj = new obj.constructor();
        
        var key;
        for(key in obj) { 
            if(obj.hasOwnProperty(key)) {
                newObj[key] = obj.clone(obj[key], true); 
            }
        }

        newObj._existCSS = true;
        return newObj;
    },
    _createInput: function () {
        "use strict";
        
        if (!this._tableObj) { return; }

        this._inputDiv = this._getInput();
        this._inputRuler = this._getRuler();
        this._addressBoxUl = this._getAddressBoxUl();

        var inputLi = this._getAddressBoxLi();
        this._addressBoxList.push(inputLi);
        this._virtualAddressInput = this._getVirtualAddressInput();
        this._autoCompleteDiv = this._getAutoComplete();

        // 컨트롤 구성
        inputLi.appendChild(this._virtualAddressInput);
        this._addressBoxUl.appendChild(inputLi);
        this._inputDiv.appendChild(this._inputRuler);
        this._inputDiv.appendChild(this._addressBoxUl);

        this._tableObj.appendChild(this._inputDiv);
        this._tableObj.appendChild(this._autoCompleteDiv);

        this._inputDiv.blass = this;
        this._virtualAddressInput.blass = this;
        this._inputDiv.onclick = function (evt) { this.blass._focusVirtualAddressInput(evt); }; // 삭제버튼 클릭
        this._virtualAddressInput.onkeyup = function (evt) { return this.blass._createAddressInput(evt, this); }; // 키 입력
        this._virtualAddressInput.onkeydown = function (evt) { return this.blass._createAddressSpecialInput(evt, this); }; // 특수 키 입력
        this._virtualAddressInput.onkeypress = function (evt) { // 이벤트 발생 시작
            this.blass._checkInput = true;
            this.blass._checkInputData();
        };
        this._virtualAddressInput.onblur = function (evt) { // 이벤트 발생 중지
            this.blass._createAddressInput({ keyCode: 13 }, this);
            this.blass._checkInput = false;
        };
    },
    _getAutoComplete: function () {
        "use strict";
        
        var obj = document.createElement("div");
        obj.className = "blass_eai_ac";
        return obj;
    },
    _setAutoCompleteData: function (address) {
        "use strict";
        
        if (!this._autoCompleteHandler ||
        !this._selectedAutoCompleteProcess ||
        !address) { return; } // 헨들러가 없거나 진행중이면 취소

        this._selectedAutoCompleteProcess = false; // 진행 시작
        this._resetAutoCompleteData();
        this._autoCompleteLast = address; // 마지막 입력값 갱신

        if (!this._autoCompleteCallback) {
            this._autoCompleteData = this._autoCompleteHandler(address);
            this._showAutoCompleteLayer();
        } else { // call back
            this._autoCompleteCallback.blass = this;
            this._autoCompleteHandler(address, this._autoCompleteCallback);
        }
    },
    setAutoCompleteCallBack: function (data) { // callback 후 호출해야할 메소드
        "use strict";
        
        this._autoCompleteData = data;
        this._showAutoCompleteLayer();
    },
    _showAutoCompleteLayer: function () {
        "use strict";
        
        this._selectedAutoCompleteProcess = true; // 진행 끝
        if (!this._autoCompleteData || this._autoCompleteData.length === 0) { return; }

        var i;
        for (i = 0; i < this._autoCompleteData.length; ++i) {
            
            var obj = document.createElement("div");
            obj.innerHTML = this._autoCompleteData[i].text;
            obj.className = "blass_eai_aclayer";
            obj.blass = this;
            obj.index = i;
            obj.onclick = function (evt) { // autocomplete layer 클릭시 입력
                evt = { keyCode: 13 };
                this.blass._selectedAutoCompleteIndex = this.index;
                this.blass._createAddressInput(evt, this.blass._virtualAddressInput);
                this.blass._focusVirtualAddressInput();
            };
            
            this._autoCompleteDiv.appendChild(obj);
            this._autoCompleteResult.push(obj);
        }
        this._autoCompleteDiv.style.visibility = "visible";
        this._selectAutoCompleteData(1);
    },
    _selectAutoCompleteData: function (increase) {
        "use strict";
        
        if (!this._autoCompleteData || this._autoCompleteData.length === 0) { return; }
        if (this._selectedAutoCompleteIndex >= 0) {
            this._autoCompleteResult[this._selectedAutoCompleteIndex].className = "blass_eai_aclayer blass_eai_normal";
        }
        this._selectedAutoCompleteIndex += increase;
        if (this._selectedAutoCompleteIndex < 0) {
            this._selectedAutoCompleteIndex = -1;
            return; // 선택한것 없음. 초기설정
        }

        if (this._selectedAutoCompleteIndex < 0) { this._selectedAutoCompleteIndex = 0; }
        if (this._selectedAutoCompleteIndex >= this._autoCompleteResult.length) {
            this._selectedAutoCompleteIndex = this._autoCompleteResult.length - 1;
        }
        this._autoCompleteResult[this._selectedAutoCompleteIndex].className = "blass_eai_aclayer blass_eai_select";
    },
    _resetAutoCompleteData: function () {
        "use strict";
        
        this._autoCompleteDiv.style.visibility = "hidden";
        
        var r;
        for (r = this._autoCompleteDiv.childNodes.length - 1; r >= 0; r--) {
            this._autoCompleteDiv.removeChild(this._autoCompleteDiv.childNodes[r]);
        }
        this._selectedAutoCompleteIndex = -1;
        this._autoCompleteData = null;
        this._autoCompleteResult = [];
    },
    _getAddressBoxId: function () { // 아이디 생성
        "use strict";
        
        return this._addressBoxIdPrefix + this._inputStyle.id + (++this._addressBoxId);
    },
    _getInput: function () { // 컨트롤 포괄 div
        "use strict";
        
        var obj = document.createElement("div");
        obj.className = "blass_eai_inputdiv";
        obj.width = this._inputStyle.width;
        return obj;
    },
    _getRuler: function () { // 컨트롤 길이 결정하기 위한 ruler div
        "use strict";
        
        var obj = document.createElement("div");
        obj.className = "blass_eai_ruler";
        obj.width = this._inputStyle.width;
        return obj;
    },
    _getAddressBoxLi: function () {
        "use strict";
        
        var obj = document.createElement("li");
        obj.id = this._getAddressBoxId();
        obj.className = "blass_eai_li";
        return obj;
    },
    _getAddressBoxUl: function () { // 내부 박스를 위한 ul
        "use strict";
        
        var obj = document.createElement("ul");
        obj.className = "blass_eai_ul";
        return obj;
    },
    _getVirtualAddressInput: function () { // 텍스트 입력을 받을 input, 실제로 보이지는 않음.
        "use strict";
        
        var obj = document.createElement("input");
        obj.type = "text";
        obj.className = "blass_eai_input";
        return obj;
    },
    _focusVirtualAddressInput: function () {
        "use strict";
        
        this._virtualAddressInput.select();
        this._virtualAddressInput.focus();
    },
    getAddresses: function () {
        "use strict";
        
        var addresses = "";
        var i;
        for (i = 1; i < this._addressBoxList.length; i++) {
            if (this._addressBoxList[i].objValue && this._addressBoxList[i].isValid) { // 유효한 메일 주소만 추출
                addresses += this._addressBoxList[i].objValue + ",";
            }
        }
        if (addresses.substr(addresses.length - 1, 1) === ",") { addresses = addresses.substr(0, addresses.length - 1); }
        return addresses;
    },
    createAddressBox: function (addressObj) { // 주소 박스 등록
        "use strict";
        
        var address = addressObj.text;
        if (address === "") { return; }
        var isValid = (!addressObj.validation) ? this.validation(addressObj.value) : addressObj.validation;

        // 주소 등록용 li
        var addressBoxLi = document.createElement("li");
        addressBoxLi.className = "blass_eai_box " + ((isValid) ? "blass_eai_valid" : "blass_eai_invalid");
        addressBoxLi.id = this._getAddressBoxId();
        addressBoxLi.objValue = addressObj.value;
        addressBoxLi.isValid = isValid;

        // 주소 필드 생성
        var addressSpan = document.createElement("span");
        addressSpan.className = "blass_eai_address";
        addressSpan.innerHTML = address;
        addressBoxLi.appendChild(addressSpan);

        // 삭제 버튼 생성
        var addressDel = document.createElement("span");
        addressDel.className = "blass_eai_delete";
        addressBoxLi.appendChild(addressDel);

        // 삭제 버튼 클릭시
        addressDel.blass = this;
        addressDel.onclick = function () {
            this.blass._removeAddressBox(this.parentNode.id);
        };

        this._addressBoxUl.insertBefore(addressBoxLi, this._addressBoxList[0]);
        this._addressBoxList.push(addressBoxLi);
    },
    _createCSS: function () {
        "use strict";
        
        if (this._existCSS) { return; }
        var style = document.createElement("style");
        var def = ".blass_eai_ac { border: solid 1px #cccccc; width: 500px; visibility: hidden; position: absolute; background-color:#ffffff; padding: 5px; z-index: 1000; font-size:" + this._inputStyle.fontSize + "; }";
        def += ".blass_eai_aclayer { padding: 0px 0px 3px 0px; cursor:pointer }";
        def += ".blass_eai_select { font-weight: bold; }";
        def += ".blass_eai_normal { font-weight: normal; }";

        var exception = false;
        if (navigator.appName === "Microsoft Internet Explorer") { // IE확인
            var ua = navigator.userAgent;
            var real_ver = parseInt(ua.substring(ua.indexOf("MSIE ") + 5), null); // IE 6 이하버전만..
            if (real_ver <= 6) {
                exception = true;
                def += ".blass_eai_inputdiv { height: 22px; padding:1px; cursor:text; border:" + this._inputStyle.border + "; }";
            }
        }

        if (!exception) { def += ".blass_eai_inputdiv { max-height: 46px; overflow-y: auto; padding:1px; cursor:text; border:" + this._inputStyle.border + "; }"; }
        def += ".blass_eai_li { margin-left:6px; }";
        def += ".blass_eai_ul { list-style-type:none; margin:0px; padding:0px; }";
        def += ".blass_eai_input { outline:none; width:50px; height: 18px; margin-top: 3px; padding:0px 0px 0px 3px; border:0px solid #ffffff; overflow:hidden; float:left; }";
        def += ".blass_eai_box { display:block; height: 14px; margin:1px; padding:2px 7px; width:auto; float:left; }";

        def += ".blass_eai_ruler { position: absolute; overflow:hidden; visibility:hidden; z-index:-1; }";
        def += ".blass_eai_valid { border:1px solid #bbd8fb; background-color:#f3f7fd; }";
        def += ".blass_eai_invalid { border:1px solid #b55e5e; background-color:#fdf5f5; }";
        def += ".blass_eai_delete { cursor:pointer; margin:2px 0px 0px 5px; float:left; width:9px; height:9px; }";
        def += ".blass_eai_valid .blass_eai_delete { background:url(data:image/gif;base64,R0lGODlhCQAJAKIAAJu226O83pOx15u32////////wAAAAAAACH5BAEAAAUALAAAAAAJAAkAAAMaGLo6ATAC8Ui0FFo7n44ZsEEZJ3YSOAhsyyYAOw==) no-repeat; }";
        def += ".blass_eai_invalid .blass_eai_delete { background:url(data:image/gif;base64,R0lGODlhCQAJAKIAALukpaqQkrSanKKGif708v///wAAAAAAACH5BAEAAAUALAAAAAAJAAkAAAMaCLoqEDCG8Ui0FFo7n45ZsEEZJ3YSOKwsmwAAOw==) no-repeat; }";
        def += ".blass_eai_address { float:left; }";

        style.setAttribute("type", "text/css");
        if (style.styleSheet) {     // IE
            style.styleSheet.cssText = def;
        } else {                    // the world
            var tnode = document.createTextNode(def);
            style.appendChild(tnode);
        }
        var hd = document.getElementsByTagName('head')[0];
        if (hd) { hd.appendChild(style); }
        this._existCSS = true;
    },
    removeAllAddressBox: function () {
        "use strict";
        
        if (this._addressBoxList.length <= 1) { return; }
        
        var i;
        for (i = this._addressBoxList.length - 1; i > 0; i--) {
            this._removeAddressBox(this._addressBoxList[i].id);
        }
        this._resetVirtualAddressInput();
        this._resetAutoCompleteData();
    },
    _resetVirtualAddressInput: function () {
        "use strict";
        
        this._virtualAddressInput.value = "";
        this._inputRuler.innerHTML = "";
    },
    _removeAddressBox: function (id) {
        "use strict";
        
        if (this._addressBoxList.length <= 1) { return; }
        if (!id) { id = this._addressBoxList[this._addressBoxList.length - 1].id; }
        var deleteObj = document.getElementById(id);
        var tmpList = [];
        
        var i;
        for (i = 0; i < this._addressBoxList.length; i++) {
            if (this._addressBoxList[i].id !== id) {
                tmpList.push(this._addressBoxList[i]);
            }
        }
        this._addressBoxList = tmpList;
        this._addressBoxUl.removeChild(document.getElementById(id));
    },
    _intervalCheckInput: function () {
        "use strict";
        
        setTimeout(this._intervalCheckInput(), 1000);
    },
    _createAddressInput: function (evt, obj) {
        "use strict";
        
        var hEvent = evt || event;
        switch (hEvent.keyCode) {
            case 13:    // enter
            case 32:    // space
            case 186:    // ';'
            case 188:    // ','
                var isValid = null;
                var selectedValue = null;
                if (this._autoCompleteData && this._selectedAutoCompleteIndex >= 0) {
                    obj.value = this._autoCompleteData[this._selectedAutoCompleteIndex].text;
                    selectedValue = this._autoCompleteData[this._selectedAutoCompleteIndex].value;
                    isValid = true;
                }

                obj.value = obj.value.replace(/^[,;\s]*/, '').replace(/[,;\s]*$/, ''); // trim
                if (!selectedValue) { selectedValue = obj.value; }
                if (obj.value === "") { return; }

                //                if (!isValid) { // validation 이 false이면 autocomplete의 가장 첫번째 목록으로 채워줌
                //                    if (this._autoCompleteData && this._autoCompleteData.length > 0) {
                //                        obj.value = this._autoCompleteData[0].text;
                //                        selectedValue = this._autoCompleteData[0].value;
                //                        isValid = true;
                //                    }
                //                }

                this._resetAutoCompleteData(); // autoComplete box 초기화
                this.createAddressBox({ text: obj.value, value: selectedValue, validation: isValid });
                this._resetVirtualAddressInput(); // input box 초기화
                break;

            case 27:    // ESC
                this._resetAutoCompleteData(); // autoComplete box 초기화
                this._resetVirtualAddressInput();   // input box 초기화
                break;

            case 40:    // 아래 이동
            case 38:    // 위 이동
                break;

            default:
                this._inputRuler.innerHTML = obj.value;
                //this._setAutoCompleteData(obj.value);
                break;
        }
        
        this._resizeVirtualAddressInput();
        return hEvent.keyCode !== 13; // enter 일때 return false
    },
    _createAddressSpecialInput: function (evt, obj) { // 특수키 입력 처리 핸들러
        "use strict";
        
        var result = true;
        var hEvent = evt || event;
        switch (hEvent.keyCode) {
            case 8:    // backspace
                if (obj.value === "") {
                    this._resetAutoCompleteData(); // autoComplete box 초기화
                    this._removeAddressBox();
                }
                break;

            case 40:    // 아래 이동
            case 38:    // 위 이동
                this._selectAutoCompleteData((hEvent.keyCode === 40) ? 1 : -1);
                break;

            default:
                //this._inputRuler.innerHTML = obj.value;
                break;
        }
        
        this._resizeVirtualAddressInput();
        return hEvent.keyCode !== 13; // enter 일때 return false
    },
    _checkInputResetCounter: function () {
        "use strict";
        
        this._checkInputCounter = 2;
    },
    _checkInputData: function () {
        "use strict";
        
        if (this._checkInput) {
            var blass = this;
            setTimeout(function () {
                if (blass._checkInputBuffer !== blass._virtualAddressInput.value) {
                    blass._checkInputResetCounter();
                    blass._checkInputBuffer = blass._virtualAddressInput.value;
                } else {
                    if (blass._checkInputBuffer && // 입력 버퍼 확인
                        blass._autoCompleteLast !== blass._checkInputBuffer) { // 입력없이 가만히 있는 부분 체크
                        --blass._checkInputCounter;
                        if (blass._checkInputCounter <= 0) {
                            blass._checkInputResetCounter();
                            blass._setAutoCompleteData(blass._virtualAddressInput.value);
                        }
                    }
                }

                blass._checkInputData();    // 입력값 체크
            }, this._checkInputInterval);
        }
    },
    _resizeVirtualAddressInput: function () {
        "use strict";
        
        this._virtualAddressInput.style.width = this.getInputWidth(this._inputRuler);
    },
    getInputWidth: function (ruler) {
        "use strict";
        
        var setWidth = ruler.offsetWidth + 20;
        if (setWidth < 50) { setWidth = 50; }
        return setWidth + "px";
    },
    validation: function (address) {
        "use strict";
        
        var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
        return reg.test(address);
    }
};