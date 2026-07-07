const compiler = require('vue-template-compiler');
const transpile = require('vue-template-es2015-compiler');
const fs = require('fs'); // 引入 Node.js 原生文件系统模块

// 1. 把你 300 多行的 HTML 模版完整地粘在下面
const htmlTemplate = `
        <div class="price_tool" ref="tool_panel" :style="panelStyle">
                <div class="price_tool_alert_box">
                    <div class="price_tool_alert scale-in" :class="item.type" v-for="item in alertMsg" :key="item.msg">
                        {{item.msg}}
                    </div>
                </div>
                <form id="price_tool_form">
                    <div class="price_tool_input_div" v-for="(item,index) in inputList" :key="item.id">
                        <label class="price_tool_input_btn" :class="{price_tool_locked:inputLock.includes(item.name)}"
                            :for="item.id">
                            {{item.describe.name}}
                        </label>
                        <svg :class="{price_tool_hide:!inputLock.includes(item.name),icon_forbid:inputLock.includes(item.name)}" class="icon" viewBox="0 0 1024 1024"
                            version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M512 64c153.173333 0 277.333333 124.16 277.333333 277.333333v128a128 128 0 0 1 128 128v234.666667a128 128 0 0 1-128 128H234.666667a128 128 0 0 1-128-128V597.333333a128 128 0 0 1 128-128v-128c0-153.173333 124.16-277.333333 277.333333-277.333333z m277.333333 469.333333H234.666667a64 64 0 0 0-63.893334 60.245334L170.666667 597.333333v234.666667a64 64 0 0 0 60.245333 63.893333L234.666667 896h554.666666a64 64 0 0 0 63.893334-60.245333L853.333333 832V597.333333a64 64 0 0 0-60.245333-63.893333L789.333333 533.333333z m-243.2 106.666667c4.693333 0 8.533333 3.84 8.533334 8.533333v110.933334a8.533333 8.533333 0 0 1-8.533334 8.533333h-46.933333a8.533333 8.533333 0 0 1-8.533333-8.533333v-110.933334c0-4.693333 3.84-8.533333 8.533333-8.533333h46.933333zM512 128c-115.84 0-210.090667 92.309333-213.248 207.36L298.666667 341.333333v128h426.666666v-128c0-115.84-92.309333-210.090667-207.36-213.248L512 128z"
                                p-id="2041"></path>
                        </svg>
                        <input class="price_tool_checkbox" type="checkbox" :id="item.id" :value="item.name"
                            :disabled="inputLock.includes(item.name)" v-model="inputLock" />
                        <input type="number" step="0.01" min="0" class="price_tool_input" :ref="item.id"
                            :class="{price_tool_locked:inputLock.includes(item.name)}" v-model="item.value"
                            @input="updateValue(index)" :placeholder="item.describe.content" />
                    </div>
                </form>
                <form id="price_tool_rate_form">
                    <div class="price_tool_rate_div">
                        <label class="price_tool_chose_btn" @click="showCurrencySelector('foreign')">
                            {{CURRENCY_DATA[currency.foreign.select].strSymbol}}
                            <svg class="price_tool_menu_text" :class="{transparent:currency.foreign.loading}" viewBox="0 0 20 20"><path d="M5.14541 6.89977L10.0063 12.2027L14.8671 6.89977C15.3557 6.36674 16.145 6.36674 16.6336 6.89977C17.1221 7.4328 17.1221 8.29385 16.6336 8.82688L10.8832 15.1002C10.3946 15.6333 9.60537 15.6333 9.11678 15.1002L3.36644 8.82688C2.87785 8.29385 2.87785 7.4328 3.36644 6.89977C3.85503 6.38041 4.65682 6.36674 5.14541 6.89977Z" fill="currentColor"></path></svg>
                            <svg class="currency_loading" v-if="currency.foreign.loading" viewBox="0 0 1024 1024" width="18" height="18" ><path d="M128 512c0-211.2 172.8-384 384-384s384 172.8 384 384c0 38.4-25.6 64-64 64s-64-25.6-64-64c0-140.8-115.2-256-256-256S256 371.2 256 512s115.2 256 256 256c38.4 0 64 25.6 64 64s-25.6 64-64 64c-211.2 0-384-172.8-384-384z" p-id="4797"></path></svg>
                        </label>
                        <input type="number" min="0" step="0.01" class="price_tool_rate_input" v-model="exchangeValue.foreign"
                            @input="calculateExchangeValue('foreign')"
                            :placeholder="CURRENCY_DATA[currency.foreign.select].strName" />
                    </div>
                    <div class="price_tool_rate_div">
                        <label class="price_tool_chose_btn" @click="showCurrencySelector('origin')">
                            {{CURRENCY_DATA[currency.origin.select].strSymbol}}
                            <svg class="price_tool_menu_text" :class="{transparent:currency.origin.loading}" viewBox="0 0 20 20"><path d="M5.14541 6.89977L10.0063 12.2027L14.8671 6.89977C15.3557 6.36674 16.145 6.36674 16.6336 6.89977C17.1221 7.4328 17.1221 8.29385 16.6336 8.82688L10.8832 15.1002C10.3946 15.6333 9.60537 15.6333 9.11678 15.1002L3.36644 8.82688C2.87785 8.29385 2.87785 7.4328 3.36644 6.89977C3.85503 6.38041 4.65682 6.36674 5.14541 6.89977Z" fill="currentColor"></path></svg>
                            <svg class="currency_loading" v-if="currency.origin.loading" viewBox="0 0 1024 1024" width="18" height="18" ><path d="M128 512c0-211.2 172.8-384 384-384s384 172.8 384 384c0 38.4-25.6 64-64 64s-64-25.6-64-64c0-140.8-115.2-256-256-256S256 371.2 256 512s115.2 256 256 256c38.4 0 64 25.6 64 64s-25.6 64-64 64c-211.2 0-384-172.8-384-384z" p-id="4797"></path></svg>
                        </label>
                        <input type="number" min="0" step="0.01" class="price_tool_rate_input" v-model="exchangeValue.origin"
                            @input="calculateExchangeValue('origin')" :placeholder="CURRENCY_DATA[currency.origin.select].strName" />
                    </div>
                    <div class="currency_selector">
                        <div class="price_detail" v-show="priceDetail.display" :style="[selectorStyle,detailDisplaySide()]">
                            <div class="name">
                                <img class="profile_flag" :src="'https://community.fastly.steamstatic.com/public/images/countryflags/' + computedPriceDetail.flag + '.gif'">
                                {{computedPriceDetail.name}}
                            </div>
                            <div class="in">
                            <span>兑入：</span>
                            <span>{{computedPriceDetail.in}}</span>
                            </div>
                            <div class="out">
                            <span>兑回：</span>
                            <span>{{computedPriceDetail.out}}</span>
                            </div>
                            <span style="font-size: 14px;color: #c86375;">以上汇率基于人民币</span>
                            <div class="example">
                            货币格式：<br/>
                                {{computedPriceDetail.example}}
                            </div>
                            <div class="detail_time">
                                <span>{{computedPriceDetail.diff}}</span><br/>
                                <span>{{computedPriceDetail.time}}</span>
                            </div>
                        </div>
                        <transition enter-active-class="scale-in" leave-active-class="scale-out">
                            <div class="currency_selector_menu" ref="selector" @click="changeCurrency" @mouseleave="selectorStatus = false;priceDetail.display = false" v-show="selectorStatus" :style="selectorStyle">
                                <span class="currency_selector_item" v-for="(value, key) in CURRENCY_DATA" :key="key"
                                    :style="{'border-color':currencyStatus(key)}" :value="key" @mouseover="displayDetail(key)">
                                    <img class="profile_flag" :src="'https://community.fastly.steamstatic.com/public/images/countryflags/' + value.countryCode + '.gif'">
                                    {{value.strName}}
                                    <span class="f-right" :value="key">{{value.strSymbol}}</span>
                                </span>
                            </div>
                        </transition>
                    </div>
                </form>
                <div style="margin-top: 5px;">
                    <span class="price_tool_drag_bar" :class="{grabbing:dragSetting.dragging}" @mousedown="startDrag" @mousemove="dragging">拖动</span>
                </div>
            </div>
`;

// 2. 底层编译
const compiled = compiler.compile(htmlTemplate);

// 3. 核心魔术：自动断绝 with(this)，自动注入 _vm. 前缀，输出严格模式安全代码
const finalRender = transpile(`function render() {${compiled.render}}`);

// 4. 将编译好的渲染函数直接写入到同级目录的 render.js 中
fs.writeFileSync('render.js', finalRender, 'utf-8');
// 内容：; + 换行 \n
const appendStr = ';\n';
// 追加到文件末尾
fs.appendFileSync('render.js', appendStr, 'utf8');

console.log("====== 编译成功 ======");
console.log("代码已自动写入到同级目录下的 render.js 文件中。");