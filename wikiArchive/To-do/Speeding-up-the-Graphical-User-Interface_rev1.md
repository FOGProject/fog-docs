FOG\'s User Interface runs on your main FOG server, which is likely a
well-built machine. The interface experiences some delays responding to
user input because of some of the overhead it has to handle, but also
because it attempts to provide real-time updates about the status of
your hosts.\

There are two settings that can be modified to increase FOGs
responsiveness:

```{=html}
<LI>
```
**Disable animations**:\
About \> FOG Settings \> General Settings \>
`FOG_USE_ANIMATION_EFFECTS`: Set to `0`\
This will make FOG messages appear instantly rather than slowly
decending from the top of the page.\
:Note: It is usually not necessary to actually click `Ok` on the
message. Just continue to the next task.

```{=html}
</LI>
```
```{=html}
<LI>
```
**Disable Host Lookup**:\
About \> FOG Settings \> General Settings \> `FOG_HOST_LOOKUP`: Set to
`0`\
:**Caution**: As noted in [this
thread](http://www.edugeek.net/forums/o-s-deployment/63902-slow-gui.html),
this also has the negative impact of breaking the
search-for-hosts-as-you-type feature.

```{=html}
</LI>
```
```{=html}
</UL>
```
Changing the value of FOG_VIEW_DEFAULT_SCREEN in FOG View Settings to 1
saves having to press \'list all\' in the hosts and image screens.
