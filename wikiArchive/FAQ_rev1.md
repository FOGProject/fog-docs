# Kernel Panic or Drivers Not functioning {#kernel_panic_or_drivers_not_functioning}

## Have you tried(As root on your FOG server) {#have_you_triedas_root_on_your_fog_server}

### FOG 0.32 or earlier. {#fog_0.32_or_earlier.}

Code:

    cd /tftpboot/fog/kernel
    mv bzImage bzImage.orig.<CURRENTDATE>
    wget -O bzImage --no-check-certificate https://mastacontrola.com/fogboot/kernel/bzImage32
    chown -R fog:root /tftpboot

### FOG 0.33 (64 Bit) OR Download through the kernel updater under Unofficial Kernels. {#fog_0.33_64_bit_or_download_through_the_kernel_updater_under_unofficial_kernels.}

Code:

    cd /var/www/<FOGWEBDIR>/service/ipxe
    mv bzImage bzImage.orig.<CURRDATE>
    wget -O bzImage --no-check-certificate https://mastacontrola.com/fogboot/kernel/bzImage
    chown -R fog.<APACHEUSER (e.g. apache -- redhat, www-data -- debian)> /var/www/<FOGWEBDIR>/service/ipxe

### FOG 0.33 (32 Bit) OR Download through the kernel updater under Unofficial Kernels. {#fog_0.33_32_bit_or_download_through_the_kernel_updater_under_unofficial_kernels.}

Code:

    cd /var/www/<FOGWEBDIR>/service/ipxe
    mv bzImage32 bzImage32.orig.<CURRDATE>
    wget -O bzImage32 --no-check-certificate https://mastacontrola.com/fogboot/kernel/bzImage32
    chown -R fog.<APACHEUSER (e.g. apache -- redhat, www-data -- debian)> /var/www/<FOGWEBDIR>/service/ipxe
