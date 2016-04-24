---
title: Symfony and SELinux
categories: ['symfony', 'selinux', 'linux']
timestamp: 1461435089
---
This article contains a short introduction to using SELinux to confine
web applications on your server.

The introduction is a short and interactive tutorial, which
you can go through by getting the `Vagrantfile` linked at the bottom of this 
 article and creating a VM. 
 
### *Why* do I need SELinux?

SELinux is a great tool to secure a Linux system. It enforces _Mandatory
Access Control_ based on a subjects assigned security context from a centrally
controlled security policy. This contrasts with _Discretionary Access Control_ 
which enforces based on the user identity and delegates authorization
down to the users own decisions.

In _Mandatory Access Control_ the system and its central policy specifies
which subjects are allowed to access its objects.  In SELinux we use
security labels on subjects and objects to compute access decisions,
and can write rules which say subjects with the type `gpg_t`
can access objects with the type `gpg_keyfile_t` and enforce in the policy 
that only the GPG process can read GPG keyfiles.

<!---more-->

### Getting Started

To get started with confining a web application, we will first need a web 
application to confine. A simple nginx / php-fpm stack / Symfony stack is 
sufficient for what we need to do.

There won't be any exposure to RDBMS or cache servers (like MySQL or Redis,
respectively) but I will touch on how you can allow your web application
to use these services all the while playing with SELinux.

#### Setup

To test in a development environment we need a Linux distribution
which has its own maintained SELinux policy. You'll need some way to 
create a new CentOS 7 box. I'm using Vagrant and the Vagrantfile I'm using
can be found at the bottom of this article as a link.

Once you have a virtual machine ready, the first command you want to run 
as root is:

```shell
setenforce 0
```
__don't worry, we're going to `setenforce 1` later__

#### System Dependencies

We'll need a PHP environment and web server to run our confined Symfony 
application. I typically run with `php-fpm` and `nginx` on my systems and
that's what I'll be using for this example. Both `php-fpm` and `nginx` are
already targeted by SELinux policy in CentOS so we don't have to do any 
configuration here. 

```shell
yum install epel-release # We need EPEL for nginx
yum install nginx php-common php-fpm composer
yum install policycoreutils-python # SELinux management utils
```

We'll also need a user for our `php-fpm` processes to run under,
so create a new user named `www` and give it the /sbin/nologin shell.

```shell
useradd --system www
chsh -s /sbin/nologin www
```

#### Setting up Symfony

After installing these dependencies we can get ourselves a copy of the Symfony
Standard Edition, and drop it into a web directory.

```shell
mkdir -p /var/www/symfony-app
cd /var/www/symfony-app
curl -L https://github.com/symfony/symfony-standard/archive/v2.3.39.tar.gz | tar --strip 1 -xvz --
chown -R www:www ./ # Fix permissions on this folder -- it will be owned by root at this point
sudo -u www composer install # Run "composer install" as the www user, we can't do this in a shell since we've set www's shell to /sbin/nologin
```

Not much is happening at this point, as we have no php-fpm, and no
nginx. Initially our php-fpm pool will be running under the `apache`
user and group, so we need to update the configuration with our new user.

```shell
sed -i 's/user = apache/user = www/' /etc/php-fpm.d/www.conf
sed -i 's/group = apache/group = www/' /etc/php-fpm.d/www.conf
```

Additionally it'd be wise to turning on error reporting, so we can see
in our browser what's causing the web server to issue an error page
and also set a valid timezone to suppress the annoying PHP warning.

```shell
echo 'php_flag[display_errors] = on' >> /etc/php-fpm.d/www.conf
echo 'date.timezone = Europe/London' >> /etc/php.ini
```

Superb. We have a working `php-fpm` configuration now, ready to use
as soon as we have a vhost for Symfony to run under.

The following step is creating an nginx configuration file which sets up
the vhost that we're going to be serving Symfony on. Their documentation 
provides a good example we can use for getting started:

```shell
cat > /etc/nginx/conf.d/symfony.conf <<'EOF'
server {
    server_name symfony-app.dev;
    root /var/www/symfony-app/web;
    
    location / {
        # try to serve file directly, fallback to app.php
        try_files $uri /app.php$is_args$args;
    }
    # DEV
    # This rule should only be placed on your development environment
    # In production, don't include this and don't deploy app_dev.php or config.php
    location ~ ^/(app_dev|config)\.php(/|$) {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        # When you are using symlinks to link the document root to the
        # current version of your application, you should pass the real
        # application path instead of the path to the symlink to PHP
        # FPM.
        # Otherwise, PHP's OPcache may not properly detect changes to
        # your PHP files (see https://github.com/zendtech/ZendOptimizerPlus/issues/126
        # for more information).
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
    }
    
    # PROD
    location ~ ^/app\.php(/|$) {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_split_path_info ^(.+\.php)(/.*)$;
        include fastcgi_params;
        # When you are using symlinks to link the document root to the
        # current version of your application, you should pass the real
        # application path instead of the path to the symlink to PHP
        # FPM.
        # Otherwise, PHP's OPcache may not properly detect changes to
        # your PHP files (see https://github.com/zendtech/ZendOptimizerPlus/issues/126
        # for more information).
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        fastcgi_param DOCUMENT_ROOT $realpath_root;
        # Prevents URIs that include the front controller. This will 404:
        # http://domain.tld/app.php/some-path
        # Remove the internal directive to allow URIs like this
        internal;
    }
    
    error_log /var/log/nginx/project_error.log;
    access_log /var/log/nginx/project_access.log;
}
EOF
```

This should be all we need to get traffic routed to our Symfony app.
Restart php-fpm and nginx:
```shell
systemctl enable php-fpm && systemctl start php-fpm
systemctl enable nginx && systemctl start nginx
```

If we hack a `symfony-app.dev` entry into the host machines `/etc/hosts` 
file for now we will be able to access our Symfony installation. By default
the virtual machine listens on `192.168.50.59` so we can execute the following on the
host machine to set that up: `echo "192.168.50.59 symfony-app.dev >> /etc/hosts"`. 

### We have liftoff!

![liftoff!](/assets/1-symfony-selinux/liftoff.png)

Now it's time to put SELinux back into enforcing mode, and see what problems
we have to address.

```shell
setenforce 1
```

![denied :-(](/assets/1-symfony-selinux/denied.png)

### We have AVCs!

The first step here is to examine what SELinux is preventing
us from doing. We can check AVC denials by using the `ausearch`
utility.

```shell
> $ ausearch -m AVC -ts recent
----
time->Tue Apr 19 18:40:54 2016
type=SYSCALL msg=audit(1461105654.508:546): arch=c000003e syscall=6 success=no exit=-13 a0=7fff478be590 a1=7fff478be480 a2=7fff478be480 a3=20 items=0 ppid=3915 pid=3918 auid=4294967295 uid=995 gid=993 euid=995 suid=995 fsuid=995 egid=993 sgid=993 fsgid=993 tty=(none) ses=4294967295 comm="php-fpm" exe="/usr/sbin/php-fpm" subj=system_u:system_r:httpd_t:s0 key=(null)
type=AVC msg=audit(1461105654.508:546): avc: denied { getattr } for pid=3918 comm="php-fpm" path="/var/www/symfony-app/web/app.php" dev="dm-0" ino=395144 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:var_t:s0 tclass=file
----
time->Tue Apr 19 18:40:52 2016
type=SYSCALL msg=audit(1461105652.189:545): arch=c000003e syscall=6 success=no exit=-13 a0=7fff478be590 a1=7fff478be480 a2=7fff478be480 a3=20 items=0 ppid=3915 pid=3916 auid=4294967295 uid=995 gid=993 euid=995 suid=995 fsuid=995 egid=993 sgid=993 fsgid=993 tty=(none) ses=4294967295 comm="php-fpm" exe="/usr/sbin/php-fpm" subj=system_u:system_r:httpd_t:s0 key=(null)
type=AVC msg=audit(1461105652.189:545): avc: denied { getattr } for pid=3916 comm="php-fpm" path="/var/www/symfony-app/web/app.php" dev="dm-0" ino=395144 scontext=system_u:system_r:httpd_t:s0 tcontext=unconfined_u:object_r:var_t:s0 tclass=file
```

Ouch! What does this mean to us? Well currently our web directory is
labeled with the file context `var_t`. This seems like it isn't suitable
for httpd content. Though this seems like a pretty common
path to store files for web applications. Let's see what this path
*should* be labeled as according to the loaded SELinux policy.

```shell
> $ matchpathcon /var/www
/var/www system_u:object_r:httpd_sys_content_t:s0
```

That's weird. Then why is it currently labeled as `var_t`? The 
answer is that we didn't tell `mkdir` to use the default
file contexts for this path when we created the directory,
so the context was inherited from /var.

We can fix this by using the `restorecon` utility, which 
fixes file contexts to what they should be according to policy.

```shell
restorecon -R /var/www
```

That gets by the first set of errors, but this is now where we really
need to consider what our app can and can't do. If we rm the cache and 
visit our Symfony app again it'll complain that it does not
have permissions to write to the cache. 

Warming the cache worked the first time because we ran `composer install`
in an `unconfined` user shell. However, to let scripts running in the
`httpd_t` domain write to the cache we will have to start modifying policy.
Fortunately we already have a file context defined for writable
httpd content in the [upstream policy](https://github.com/fedora-selinux/selinux-policy/blob/rawhide-contrib/apache.te#L411).

We can relabel and fix the cache directory with this context by running:

```shell
semanage fcontext -a -t httpd_sys_rw_content_t "/var/www/symfony-app/cache(/.*)?"
restorecon -R /var/www/symfony-app/cache
```

Now we're back in business! Our `/var/www/symfony-app/logs` has already
been labeled for log files by an existing file context so we don't need
to bother with that.

That about concludes this introduction to Symfony with SELinux. There's
more we could do to secure our application and some more considerations
(like cron) but now you can run Symfony applications without turning
SELinux off, which is a great step forward!

### Extras

#### I can't connect to MySQL or Redis

This problem comes from the SELinux policy
preventing httpd's from connecting to anywhere on the network (the
connection to php-fpm is allowed because port 9000 is labeled as a
httpd port).

Since this is such a common use case SELinux presents a mechanism
to allow for toggleable policy. We can see which booleans we can
toggle for the httpd policy by running:

```shell
> $ semanage boolean -l | grep 'httpd'
httpd_can_network_relay (off , off) Allow httpd to can network relay
httpd_can_connect_mythtv (off , off) Allow httpd to can connect mythtv
httpd_can_network_connect_db (off , off) Allow httpd to can network connect db
httpd_use_gpg (off , off) Allow httpd to use gpg
httpd_dbus_sssd (off , off) Allow httpd to dbus sssd
httpd_enable_cgi (on , on) Allow httpd to enable cgi
httpd_verify_dns (off , off) Allow httpd to verify dns
httpd_dontaudit_search_dirs (off , off) Allow httpd to dontaudit search dirs
httpd_anon_write (off , off) Allow httpd to anon write
httpd_use_cifs (off , off) Allow httpd to use cifs
httpd_enable_homedirs (off , off) Allow httpd to enable homedirs
httpd_unified (off , off) Allow httpd to unified
httpd_mod_auth_pam (off , off) Allow httpd to mod auth pam
httpd_run_stickshift (off , off) Allow httpd to run stickshift
httpd_use_fusefs (off , off) Allow httpd to use fusefs
httpd_can_connect_ldap (off , off) Allow httpd to can connect ldap
httpd_can_network_connect (off , off) Allow httpd to can network connect
httpd_mod_auth_ntlm_winbind (off , off) Allow httpd to mod auth ntlm winbind
httpd_tty_comm (off , off) Allow httpd to tty comm
httpd_sys_script_anon_write (off , off) Allow httpd to sys script anon write
httpd_graceful_shutdown (on , on) Allow httpd to graceful shutdown
httpd_can_connect_ftp (off , off) Allow httpd to can connect ftp
httpd_run_ipa (off , off) Allow httpd to run ipa
httpd_read_user_content (off , off) Allow httpd to read user content
httpd_use_nfs (off , off) Allow httpd to use nfs
httpd_can_connect_zabbix (off , off) Allow httpd to can connect zabbix
httpd_tmp_exec (off , off) Allow httpd to tmp exec
httpd_run_preupgrade (off , off) Allow httpd to run preupgrade
httpd_manage_ipa (off , off) Allow httpd to manage ipa
httpd_can_sendmail (off , off) Allow httpd to can sendmail
httpd_builtin_scripting (on , on) Allow httpd to builtin scripting
httpd_dbus_avahi (off , off) Allow httpd to dbus avahi
httpd_can_check_spam (off , off) Allow httpd to can check spam
httpd_can_network_memcache (off , off) Allow httpd to can network memcache
httpd_can_network_connect_cobbler (off , off) Allow httpd to can network connect cobbler
httpd_use_sasl (off , off) Allow httpd to use sasl
httpd_serve_cobbler_files (off , off) Allow httpd to serve cobbler files
httpd_execmem (off , off) Allow httpd to execmem
httpd_ssi_exec (off , off) Allow httpd to ssi exec
httpd_use_openstack (off , off) Allow httpd to use openstack
httpd_enable_ftp_server (off , off) Allow httpd to enable ftp server
httpd_setrlimit (off , off) Allow httpd to setrlimit
```

The `httpd_can_network_connect_db` boolean sounds like it 
should do the job if you only need to connect to a database.
If this doesn't cover your use cases you can use the more general
`httpd_can_network_connect` to allow connections to any service.

To toggle these booleans we run:

```shell
setsebool -P httpd_can_network_connect_db 1
```

The `-P` flag we pass tells setsetbool to persist this change so it
is applied whenever policy reloads or the machine is rebooted.

#### This doesn't work with PHP7!

PHP7 came with some pretty huge engine improvements, along with superior
JIT compilation. To allow PHP7 to do this compilation we need to allow
`httpd_t` access to the `execmem` permission. Fortunately, there is
also a boolean for this and we can enable it by running:

```shell
setsebool -P httpd_can_execmem 1
```

#### How can I avoid the issue you ran into with `mkdir`?

This is pretty simple to accomplish. `coreutils` packages that move, or
create files typically allow you to specify a `-Z` option which
indicates that the matching file context for the target path
should be assigned to the new file.

#### What if someone hijacks the web server process running under `root`? Aren't I screwed anyway?

No! The httpd_t domain only has access to whatever the 
policy explicitly granted to it. Even if we're running
as root, if we're not associated with the correct security context
to access the target file then we wil be denied access.

Example (as root):

```shell
> $ cat > test.c <<'EOF'
#include <stdlib.h>
#include <stdio.h>
#include <stddef.h>

int main(int argc, char *argv) 
{
    FILE *file = fopen("/etc/shadow", "r");

    if (file == NULL) {
        printf("We've been thwarted!\n");
        return -1;
    }

    fclose(file);

    return 0;
}
EOF
> $ gcc test.c -o test
> $ chcon "system_u:object_r:httpd_exec_t" ./test
> $ runcon "system_u:object_r:httpd_t:s0" ./test
> $ ausearch -m AVC -ts recent
----
time->Tue Apr 19 20:24:53 2016
type=SYSCALL msg=audit(1461111893.503:603): arch=c000003e syscall=2 success=no exit=-13 a0=4006a2 a1=0 a2=1b6 a3=21000 items=0 ppid=2817 pid=4495 auid=1000 uid=0 gid=0 euid=0 suid=0 fsuid=0 egid=0 sgid=0 fsgid=0 tty=(none) ses=4 comm="test" exe="/var/www/symfony-app/app/test" subj=system_u:system_r:httpd_t:s0 key=(null)
type=AVC msg=audit(1461111893.503:603): avc:  denied  { read } for  pid=4495 comm="test" name="shadow" dev="dm-0" ino=1967275 scontext=system_u:system_r:httpd_t:s0 tcontext=system_u:object_r:shadow_t:s0 tclass=file
```

If you have any questions and want to get in touch don't hesitate to! Just
see my [contact](/contact.html) page.