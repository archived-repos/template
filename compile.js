/*
 * compile.js
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Jesús Manuel Germade Castiñeiras <jesus@germade.es>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */


(function (root, factory) {
    'use strict';
    
    if ( typeof root === 'undefined' ) {
        if ( typeof module !== 'undefined' ) {
            module.exports = factory();
        }
    } else {
    	if ( root.define !== undefined ) {
            root.define('compile', factory );
        } else if ( root.fn !== undefined ) {
            root.fn.define('compile', factory );
        } else if( !root.compile ) {
            root.compile = factory();
        }
    }

})(this, function () {
    'use strict';
    
    var cmd = {},
        splitRex = /\$[\w\?]*{[^\}]+}|{\$}|{\:}/,
        matchRex = /(\$([\w\?]*){([^\}]+)})|({\$})|({\:})/g,
        emptyModel = function (){ this._parent = this; },
        parseExpression = function (expression) {
        	/* jshint ignore:start */
            return (new Function('model', 'try{ with(model) { return (' + expression + ') }; } catch(err) { return \'\'; }'));
            /* jshint ignore:end */
        };

    function _instanceof (prototype) {
    	return function (o) {
    		return o instanceof prototype;
    	};
    } 

    function isString (o) {
    	return typeof o === 'string';
    }
    var isFunction = _instanceof(Function),
    	isArray = _instanceof(Array),
    	isObject = _instanceof(Object);
    
    function $compile(tmpl){

        if( !isString(tmpl) ) {
            throw 'template should be a string';
        }

        var texts = tmpl.split(splitRex),
            list = [texts.shift()];
            
        tmpl.replace(matchRex,function(match,match2,cmd,arg,closer,colon){
            list.push( closer ? { cmd: '', arg: '/' } : ( colon ? { cmd: '', arg: 'else' } : { cmd: cmd, arg: arg } ) );
            list.push(texts.shift());
        });

        var compiled = compileTokens('root', false, list);

        return compiled;
    }
    
    $compile.cmd = function(cmd_name, handler, $parse){
        if( isString(cmd_name) && isFunction(handler) ) {
            cmd[cmd_name] = handler;
            handler.$parse = ($parse === undefined) ? true : $parse;
        }
    };
    
    $compile._run = function(tokens, model) {
        var result = '';
            
        tokens.forEach(function(token){
            if( isString(token) ) {
            	result += token;
            } else if( token instanceof ModelScript ) {
            	result += token.render(model);
            } else if( isArray(token) ) {
            	result += $compile._run(token,model);
            }
        });
        
        return result;
    };
    
    function compileTokens(cmd, arg, tokens) {
        cmd = (cmd || '').trim();
        arg = (arg || '').trim();
        
        var options = { content: [] },
            current_option = 'content',
            list = [ options.content ],
            nextOption = function(option_name) {
                options[option_name] = []; current_option = option_name; list.push(options[option_name]);
            };
        
        var token = tokens.shift();

        while( token !== undefined ){
            
            if( typeof token === 'string' ) {
            	options[current_option].push(token);
            } else if( isObject(token) ) {
                if( token.cmd ) {
                    
                    switch(token.cmd) {
                        case 'i18n':
                            options[current_option].push(new ModelScript(token.cmd,token.arg.replace(/\/$/,'')));
                            break;
                        case 'case':
                        case 'when':
                            nextOption(token.arg);
                            break;
                        default: // cmd is like a helper
                            if( token.arg.substr(-1) === '/' ) {
                            	options[current_option].push(new ModelScript(token.cmd,token.arg.replace(/\/$/,'')));
                            } else {
                            	options[current_option].push(compileTokens(token.cmd,token.arg,tokens));
                            }
                            break;
                    }
                    
                } else switch(token.arg) {
                    case 'else':
                    case 'otherwise': nextOption('otherwise'); break;
                    case '/':
                        return new ModelScript(cmd,arg,options,list); // base case
                    default:
                        options[current_option].push(new ModelScript('var',token.arg));
                        break;
                }
            }
            token = tokens.shift();
        }
        if( cmd !== 'root' ) {
        	console.log('something wrong in script');
        }
        return new ModelScript(cmd,arg,options,list);
    }
    
    function _evalExpression (expression, scope){
        scope = scope || {};

        if( /^[^\s\.]+$/.test(expression) ) {
            return scope[expression] || '';
        }

        return parseExpression(expression)(scope);
    }
    
    cmd.root = function(){ return this.content; };
    cmd.var = function(value){ return isObject(value) ? '' : (value || ''); };
    cmd.if = function(cond){ return cond ? this.content : ( this.otherwise || ''); };
    cmd['?'] = cmd.if;

    ['root', 'var', 'if', '?'].forEach(function (key) {
        cmd[key].$parse = true;
    });
    
    function ModelScript(cmd,arg,options,list){
    	this.cmd = cmd;
        this.options = options || {};
        this.options.args = arg.split(',');
        this.list = list || [];
    }
    
    ModelScript.prototype.render = function(model, args){
        var tokens, _this = this;

        model = model || {};
        args = args || {};

        if( !isFunction(cmd[_this.cmd]) ) {
        	return '[command '+_this.cmd+' not found]';
        }
        
        var params = _this.options.args;
        _this.options.model = model;
        if( cmd[_this.cmd].$parse ) {
            params = [];
            _this.options.args.forEach(function(key){
                params.push( key ? _evalExpression(key, model) : '');
            });
        }
        // console.log('launching', this.cmd, _this.options, params);
        tokens = cmd[this.cmd].apply(_this.options, params);
        
        if( isArray(tokens) ) {
        	return $compile._run(tokens,model);
        } else if( typeof tokens === 'string' ) {
        	return tokens;
        }
        return '' + tokens;
    };

    $compile.cmd('each',function(collection){
        var result = '';
        if( isArray(collection) ) {
            collection.forEach(function(model){
                result += $compile._run(this.content,model);
            });
        }
        return result;
    });
    
    // $compile.cmd('for',function(){
    //     var _for = this, result = '', selected_object = false;
        
    //     function _run (object_selector, var_name) {
    //         selected_object = _modelQuery(_for.model, object_selector);
    //         if( selected_object instanceof Array ) {
    //             selected_object.forEach(function(item){
    //                 var submodel = { _parent: _for.model };
    //                 if(var_name) {
    //                 	submodel[var_name] = item; }
    //                 else {
    //                 	submodel = item;
    //                 }
    //                 result += $compile._run(_for.content,submodel);
    //             });
    //         } else if( selected_object instanceof Object ) {
    //             Object.keys(selected_object).forEach(function(key){
    //             	var submodel = { _parent: _for.model },
    //             		item = selected_object[key];

    //                 if(var_name) {
    //                 	submodel[var_name] = item;
    //                 } else {
    //                 	submodel = item;
    //                 }
    //                 result += $compile._run(_for.content,submodel);
    //             });
    //         }
    //     }
        
    //     if( /^\s*\S+\s+in\s+\S+\s*$/.test(this.args[0]) ) {
    //         var params = this.args[0].match(/^\s*(\S+)\s+in\s+(\S+)\s*$/);
    //         _run(params[2], params[1]);
    //     }
    //     return result;
    // }, false);
    
    // $compile.cmd('with',function(){ return $compile._run(this.content, _modelQuery(this.model,this.args[0]) ); });

    return function (template) {
        var compiled = $compile(template),
            renderer = function (scope) {
                return compiled.render(scope);
            };

        renderer.compiled = compiled;

        return renderer;
    };
});
