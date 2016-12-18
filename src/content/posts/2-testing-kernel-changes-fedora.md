---
title: Testing Linux kernel changes on Fedora with qemu
longTitle: Testing Linux kernel changes on Fedora with qemu
categories: ['fedora', 'selinux', 'linux', 'kernel', 'qemu']
timestamp: 1481942164
---
I've been interested in contributing to the kernel for a while now,
and recently I've been looking into the best workflow for doing that.  I'd need
a quick way to build the kernel and test my changes.  Though, since I'm mostly
interested in the SELinux subsystem I generally need a lot of userspace tools to
use with the kernel.

Using mkosi from the systemd guys, I was able to quickly build a rootfs and boot
my compiled kernel with qemu.  This made it quite convenient to test my changes.
<!---more-->

### Step 1.  Getting and configuring the kernel

The first step in testing the kernel, is actually checking it out and
configuring it.  I took on a trivial issue from
https://github.com/selinuxproject/selinux-kernel/issues/1 so I could
start to familiarize myself with kernel code..

The kernel tree that I'm working with is from the SELinux subsystem, so I cloned
the repository from https://github.com/SELinuxProject/selinux-kernel.git and
checked out the "next" branch.

Next I need to configure my kernel build.  If I run "make menuconfig" then by
default I'll get a copy of my distributions kernel configuration if it is
available, which can be less than desirable due to the wide range of support
that distributions usually offer and the impact that'll have on my build times.

Instead I want to create a minimal kernel configuration, which I can do using
make allnoconfig.

```shell
make allnoconfig
```

Although, for simplicity here I'm going to generate a config using the
x86_64_defconfig optoin.

```shell
make x86_64_defconfig
```

This gets me a reasonably small kernel image, and the build times aren't too bad
past the initial build.

### Step 2.  Building the kernel

Now that I have the kernel configured I can kick off a build to test it out, and
reduce the build times when I make some changes:

```shell
make -j8 bzImage
```

This could take quite a while, though I could reduce the build times quite a
bit by stripping out unnecessary drivers and components from my kernel
configuration.  Once it finishes I can test it with qemu and get it to boot
(albeit with a kernel panic because there's no rootfs):

```
qemu-kvm -kernel arch/x86_64/boot/bzImage
```

Once I `git am` the patches below, I can rebuild the kernel with `make -j8
bzImage` and create a root filesystem to test out my changes with.

_patchset_
<script
src="https://gist.github.com/garyttierney/8d6dce7fde0383b85eae9bae99e9c420.js"></script>

### Step 3.  Creating a root filesystem

The mkosi tool mentioned at the beginning of this post is useful for a number of
reasons.  The images it produces can be booted with systemd-nspawn, and it
can also output images in a number of formats, for a number of distributions.

I'll be using it to create a GPT disk image, with a single ext4 partition
containing a Fedora 25 root filesystem.  By default, mkosi builds Fedora images
without an SELinux policy included so I'll need to create my own configuration
file for mkosi to load.

_mkosi.default_
```ini
[Distribution]
Distribution=fedora
Release=25

[Output]
Format=raw_gpt

[Packages]
Cache=mkosi.cache/
Packages=libselinux-utils selinux-policy selinux-policy-targeted
    policycoreutils procps-ng findutils setools-console

[Validation]
Password=myrootpw
```
As you probably gathered, this will create a Fedora 25 image with the given list
of packages and set the root password to "myrootpw".  The cache option makes the
package manager retain downloaded packages for later runs.  This is quite useful
if there's an issue in the build or we make additions. If I create this as is I
can boot it with systemd-nspawn and play around in the container:

```shell
mkosi
systemd-nspawn -bi image.raw
```

Though I'll also need to relabel the system, and I've hit a bug which is
preventing selinux-autorelabel from starting (systemd wants to relabel files it
has no access to before systemd-autorelabel starts).  So I'll create a post-install
script which will put the system into permissive mode and instruct the system to
relabel on next boot.

_mkosi.postinst_
```shell
#!/bin/sh

sed -i 's/enforcing/permissive/' /etc/selinux/config
fixfiles -F onboot
```

Running `mkosi` again regenerates the image and runs the post-installer script
inside the root fs before exeting.

### Step 4.  Booting the kernel with the root filesystem

I have everything I need now to test my patches and can boot the system to test
it out:
```shell
qemu-kvm -kernel arch/x86_64/boot/bzImage \
	 -drive format=raw,file=image.raw
	 -append "root=/dev/sda1 rw rootfstype=ext4 console=ttyS0" \
	 -m 256M -curses
```

The system doesn't take long to boot and I can see my changes almost
immediately.  Considering the initial build of the root fs and the kernel tree
are the only long processes involved, I think it's quite a convenient way to
test kernel changes on a full-blown distro.

From an already compiled kernel tree and built mkosi image I can apply my
patches and see results in ~1m:

<script type="text/javascript"
src="https://asciinema.org/a/04ct05ku01kr9r87fwhbe33o8.js"
id="asciicast-04ct05ku01kr9r87fwhbe33o8" async></script>

### Additional Resources

* mkosi - https://github.com/systemd/mkosi
* Virtualizing the running system - https://github.com/amluto/virtme
* Debugging the kernel - http://www.linux-magazine.com/Online/Features/Qemu-and-the-Kernel
