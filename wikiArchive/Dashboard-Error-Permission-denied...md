I am getting the following error on the dashboard:

`<b>`{=html}Permission denied to call method
XMLHttpRequest.open`</b>`{=html}

The cause of this error is the security built into Firefox, which
doesn\'t allow for ajax calls across domains. If you are running FOG on
a single machine then don\'t use <http://localhost/fog>; instead use
<http://%5Bipaddress_of_server%5D/fog>.

## Alternatively\...

Refering to the raw IP address of something that uses AJAX by only IP is
a crazy and insane idea\...plus kills using Virtual Hosting. You should
be a good sysadmin and configure a DNS entry for your FOG server and
amend \'WEB_HOST\' and \'STORAGE_HOST\' (should do no harm to amend
\'STORAGE_HOST\', it should not be used by the AJAX system to pull in
data from the webserver) in \'/var/www/html/fog/common/config.php\' from
the IP address to the DNS name you are using.

[category:errors](category:errors "wikilink")
[category:faq](category:faq "wikilink")
