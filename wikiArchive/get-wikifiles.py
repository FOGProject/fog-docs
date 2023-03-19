#!/usr/bin/env python3
# https://gist.github.com/Sebastian-Roth/4e660a35b5c5be751c7f459b9f161cb1#file-mediawiki_get_with_json-py

import urllib.request
import json
import ssl

url="https://wiki.fogproject.org/wiki"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with urllib.request.urlopen(f"{url}/api.php?action=query&list=allpages&format=json&aplimit=max", context=ctx) as response:
    data = json.load(response)
    # print(data)
    pages = data['query']['allpages']
    for page in pages:
        title=page['title']
        pageid=page['pageid']

        with urllib.request.urlopen(f"{url}/api.php?action=query&prop=revisions&pageids={pageid}&rvlimit=max&rvslots=*&rvprop=content&format=json", context=ctx) as response_page:
            data_page = json.load(response_page)
            revs=len(data_page['query']['pages'][f'{pageid}']['revisions'])
            print(f"title: {page['title']}, id: {pageid}, revs: {revs}")
            #print(data_page)
            revisions = data_page['query']['pages'][f'{pageid}']['revisions']
            revcount = 0
            for rev in revisions:
                try:
                    content = data_page['query']['pages'][f'{pageid}']['revisions'][revcount]['slots']['main']['*']
                except KeyError:
                    content = data_page['query']['pages'][f'{pageid}']['revisions'][revcount]['*']
                revcount = revcount + 1
                fn=f"{''.join(x for x in title if (x.isalnum() or x in '._- '))}_rev{revcount}.txt"
                #print(f"write to {fn}: {content}")
                with open(fn, 'w') as f:
                    try:
                        f.write(content)
                    except:
                        print(f"write failed")
