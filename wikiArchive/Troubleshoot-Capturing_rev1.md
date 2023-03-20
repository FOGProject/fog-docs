Article under construction. Below, you will find notes / jibberish that
I\'m collecting to make into an article.

------------------------------------------------------------------------

# Stuck on /dev/sda {#stuck_on_devsda}

Using Hard Disk: /dev/sda

After this, the capture will not continue to the next step until enter
is pressed, then you receive the message:

\"Saving Partition Table (GPT)Invalid Partition DATA!\"

Or your capture never progresses past this phase:

\"Saving original partition table\"

Your particular capture issue means the disk has remnants of GPT
partitions on them where theyre not expected to be.

You will need to put system youre trying to capture from in an
capture-debug state.

To create a debug capture, use the web interface to capture as normal,
but on the confirmation screen, check the checkbox for \"Debug\", and
then confirm the capture. Network boot the device as you normally would.
It will display some information on the screen, which you will need to
press \[enter\] to pass through, this happens twice in 1.3.0. After
this, you will be at a shell prompt. This is a Linux shell prompt.

Once at the prompt, run fixparts and accept the things it asks.

    fixparts
    /dev/sda
    follow prompts to delete and then write changes with w

From there, once fixed, you can type fog and it should begin the capture
process without hanging.

------------------------------------------------------------------------

Windows 8.0 and above can be affected by the windows dirty bit - often.
Please see: [Windows Dirty Bit](Windows_Dirty_Bit "wikilink")
