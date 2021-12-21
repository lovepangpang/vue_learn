const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名的  aa-xxx
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  aa:aa-xxx  
const startTagOpen = new RegExp(`^<${qnameCapture}`); //  此正则可以匹配到标签名 匹配到结果的第一个(索引第一个) [1]
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>  [1]
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的

// [1]属性的key   [3] || [4] ||[5] 属性的值  a=1  a='1'  a=""
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的  />    > 
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{   xxx  }} 

export function parseHTML(html) {
  // 定义个栈
  let stack = [];
  let root = null;

  function createASTElement(tag, attrs, parent = null){
    return {
      tag,
      type: 1,
      children: [],
      parent,
      attrs
    }
  }

  function start(tag, attrs) {
    // console.log('start', tag, attrs);
    // 遇到开始标签 就取栈中的最后一个作为父节点
    let parent = stack[stack.length - 1];
    let element = createASTElement(tag, attrs, parent);
    if(root == null) {
      root = element
    }
    if(parent) {
      element.parent = parent;
      parent.children.push(element);
    }
    stack.push(element)

  }

  function end(tagName) {
    // console.log('end', tagName)
    let endTag = stack.pop();
    if (endTag.tag != tagName) {
      // console.log('标签出错！')
    }
  }

  function text(chars) {
    // console.log('chars', chars)
    let parent = stack[stack.length - 1];
    chars = chars.replace(/\s/g, "");
    if(chars) {
      parent.children.push({
        type: 2,
        text: chars
      })
    }
  }

  function advance(len){
    html = html.substring(len);
  }
  function parseStartTag(){
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length)
      let end;
      let attr;
      while(!(end = html.match(startTagClose)) && (attr = html.match(attribute))) { // 有属性 且不为开始的结束标签
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5]
        })
        advance(attr[0].length)
      }
      if (end) {
        advance(end[0].length)
      }
      return match;
    } 
    return false;
  }
  // console.log(html)
  // 可以不停的截取模板，直到把模板全部解析完毕
  while (html) {
    // 解析标签和文本
    let index = html.indexOf('<');
    if (index == 0) {
      // 解析开始标签 并且把属性也解析出来
      const startTagMatch = parseStartTag()

      if(startTagMatch) { // 开始标签
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }
      let endTagThe;
      if(endTagThe = html.match(endTag)) {
        end(endTagThe[1])
        advance(endTagThe[0].length)
        continue;
      }
    }
    // 文本
    if(index > 0){ // 文本
      let chars = html.substring(0,index) //<div></div>
      text(chars);
      advance(chars.length)
    }
  }

  // console.log('ast树', root);
  return root;
}