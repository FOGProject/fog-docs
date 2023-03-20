### Green Fog {#green_fog}

My green fog was not working so I checked under *Reports Management* and
then *User Login Hist*. The login times were all wrong. I did the
following:

`nano /etc/php5/apache2/php.ini`

and modified this section:

`[Date]`\
`; Defines the default timezone used by the date functions`\
`; `[`http://php.net/date.timezone`](http://php.net/date.timezone)\
`;date.timezone =`\
`;fix dates in fog`\
`date.timezone = America/Toronto`

Then reload apache:

`/etc/init.d/apache reload`

Now the login times are correct so this will hopefully fix my problem
with Green Fog. This is on Debian Wheezy and it may or may not apply to
other systems and it may or may not be a factor. Making these changes
may also blow up everything. Of course subsitute your own time zone and
if there is a better way to fix this problem please modify this
information.
