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

    function noop () {}

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

    // ----------------------------

    function parseExpression (expression) {
        /* jshint ignore:start */
        return (new Function('model', 'try{ with(model) { return (' + expression + ') }; } catch(err) { return \'\'; }'));
        /* jshint ignore:end */
    }

    function _each(o, handler) {

      if( !isFunction(handler) ) {
        throw 'handler should be a function';
      }

      if( isArray(o) ) {
        o.forEach(handler);
      } else if( isObject(o) ) {
        for( var key in o ) {
          handler.apply(null, [o[key], key]);
        }
      }
    }

    function _extend (dest, src) {
      for( var key in src ) {
        dest[key] = src[key];
      }
    }

    function Scope (data) {
        if( data instanceof Object ) {
            _extend(this, data);
        }
    }

    Scope.prototype.$new = function(data) {
        var S = function (data) {
            if( data instanceof Object ) {
                _extend(this, data);
            }
        };
        S.prototype = this;
        return new S(data);
    };

    Scope.prototype.$extend = function(data) {
        return _extend(this, data);
    };

    Scope.prototype.$eval = function ( expression ) {
        return parseExpression(expression)(this);
    };

    // ----------------------------

    var splitRex = /\$[\w\?]*{[^\}]+}|{[\$\/]}|{\:}/,
        matchRex = /(\$([\w\?]*){([^\}]+)})|({[\$\/]})|({\:})/g;

    function _compile(tmpl){

        if( !isString(tmpl) ) {
            throw 'template should be a string';
        }

        var texts = tmpl.split(splitRex),
            list = [texts.shift()];

        tmpl.replace(matchRex,function(match, match2, cmd, expression, closer, colon){
            list.push( closer ?
            			{ cmd: '', expression: '/' } :
            			( colon ?
            				{ cmd: '', expression: 'else' } :
            				{ cmd: cmd, expression: expression }
            			)
            		);
            list.push(texts.shift());
        });

        var compiled = raiseList(list, 'root');

        return compiled;
    }

    function raiseList(tokens, cmd, expression) {
        cmd = (cmd || '').trim();
        expression = expression || '';

        var options = { content: [] },
            currentOption = 'content',
            nextOption = function (optionName) {
                options[optionName] = [];
                currentOption = optionName;
            };

        var token = tokens.shift();

        while( token !== undefined ){

            if( typeof token === 'string' ) {
            	options[currentOption].push(token);
            } else if( isObject(token) ) {
                if( token.cmd ) {

                    switch(token.cmd) {
                        case 'i18n':
                            options[currentOption].push(new ModelScript(token.cmd,token.expression.replace(/\/$/,'')));
                            break;
                        case 'case':
                        case 'when':
                            nextOption(token.expression);
                            break;
                        default: // cmd is like a helper
                            if( token.expression.substr(-1) === '/' ) {
                            	options[currentOption].push(new ModelScript(token.cmd, token.expression.replace(/\/$/,'') ));
                            } else {
                            	options[currentOption].push(raiseList(tokens, token.cmd, token.expression));
                            }
                            break;
                    }

                } else switch( token.expression ) {
                    case 'else':
                    case 'otherwise': nextOption('otherwise'); break;
                    case '/':
                        return new ModelScript(cmd, expression, options); // base case
                    default:
                        options[currentOption].push( new ModelScript('var', token.expression ) );
                        break;
                }
            }
            token = tokens.shift();
        }
        if( cmd !== 'root' ) {
        	console.log('something wrong in script');
        }
        return new ModelScript(cmd, expression, options);
    }

    _compile.cmd = function(cmdName, handler){
        if( isString(cmdName) && isFunction(handler) ) {
            cmd[cmdName] = handler;
        }
    };

    function _evalContent(scope, content) {
        var result = '';

        if( isFunction(content) ) {
          return content(scope);
        } else if( isArray(content) ) {

          // console.warn('_evalContent', scope, content);
          content.forEach(function(token){
              if( isString(token) ) {
              	result += token;
              } else if( token instanceof ModelScript ) {
              	result += token.render(scope);
              } else if( isArray(token) ) {
              	result += _evalContent(scope, content);
              }
          });

          return result;
        } else {
          return content;
        }
    }

    var RE_EACH = /^(.*)\bin\b(.*)$/,
      cmd = {
        root: function(scope){
          return this.content(scope);
        },
        var: function(scope, expression){
          return scope.$eval(expression);
        },
        if: function(scope, condition){
          return scope.$eval(condition) ? this.content(scope) : this.otherwise(scope);
        },
        each: function (scope, expression) {
          var _this = this;
          console.log('each', expression, RE_EACH.test(expression) );
          return expression.replace(RE_EACH, function (match, itemExp, listExp) {

            var o = {},
                result = '',
                list = scope.$eval(listExp);

            itemExp = itemExp.trim();

            if( isArray(list) ) {
              for( var i = 0, len = list.length; i < len ; i++ ) {
                o[itemExp] = list[i];
                o.$index = i;
                result += _this.content( scope.$new(o) );
              }
            } else if( isObject(list) ) {
              for( var key in list ) {
                o[itemExp] = list[key];
                o.$key = key;
                result += _this.content( scope.$new(o) );
              }
            }
            return result;
          });
        }
      };
    cmd['?'] = cmd.if;

    function _optionEvaluator (content) {
      return function (scope) {
        return _evalContent(scope, content );
      };
    }

    function ModelScript(cmd, expression, options){
        this.cmd = cmd;
        this.expression = expression;
        this.options = { content: noop, otherwise: noop };

        for( var key in options ) {
          this.options[key] = _optionEvaluator(options[key]);
        }
    }

    ModelScript.prototype.render = function (data) {

        if( !isFunction(cmd[this.cmd]) ) {
          return '[command ' + this.cmd+' not found]';
        }

        // var scope = ( data && data.$new ) ? data.$new() : new Scope(data),
        var scope = ( data instanceof Scope ) ? data : new Scope(data),
            content = cmd[this.cmd].apply(
                          this.options,
                          [scope].concat( this.expression.split(',') )
                      );

        // console.log('render', scope, scope.foo, content);

        return _evalContent(scope, content);
    };

    function compile (template) {
        var compiled = _compile(template),
            renderer = function (scope) {
                return compiled.render(scope);
            };

        renderer.compiled = compiled;

        return renderer;
    }

    return compile;
});
