export default function help(){
    console.log(`run databridge <command>

All commands:
    
    update, version, help, init, connect
`);
}

/*<!--Usage:-->

<!--databridge install        install all the dependencies in your project-->
<!--databridge install <foo>  add the <foo> dependency to your project-->
<!--databridge test           run this project's tests-->
<!--databridge run <foo>      run the script named <foo>-->
<!--databridge <command> -h   quick help on <command>-->
<!--databridge -l             display usage info for all commands-->
<!--databridge help <term>    search for help on <term> (in a browser)-->
<!--databridge help databridge       more involved overview (in a browser)-->


<!--Specify configs in the ini-formatted file:-->
<!--    C:\Users\chauk\.npmrc-->
<!--or on the command line via: databridge <command> &#45;&#45;key=value-->

<!--More configuration info: databridge help config-->
<!--Configuration fields: databridge help 7 config-->

<!--databridge@11.16.0 C:\Program Files\nodejs\node_modules\databridge-->*/