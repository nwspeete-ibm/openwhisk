#!/bin/bash
#
# use the command line interface to install standard actions deployed
# automatically
#

# The first argument is the catalog authentication key, which can be passed via either
# a file or the key itself.
SCRIPTDIR="$(cd $(dirname "$0")/ && pwd)"
OPENWHISK_HOME="$SCRIPTDIR/.."
CATALOG_AUTH_KEY=${1:-"$OPENWHISK_HOME/ansible/files/auth.whisk.system"}

# If the auth key file exists, read the key in the file. Otherwise, take the
# first argument as the key itself.
if [ -f "$CATALOG_AUTH_KEY" ]; then
    CATALOG_AUTH_KEY=`cat $CATALOG_AUTH_KEY`
fi

# Make sure that the catalog_auth_key is not empty.
: ${CATALOG_AUTH_KEY:?"CATALOG_AUTH_KEY must be set and non-empty"}

# The api host is passed as the second argument. If it is not provided, take the edge
# host from the whisk properties file.
API_HOST=$2
if [ -z "$API_HOST" ]; then
    WHISKPROPS_FILE="$OPENWHISK_HOME/whisk.properties"
    if [ ! -f "$WHISKPROPS_FILE" ]; then
        echo "API_HOST must be set and non-empty."
        exit 1
    fi
    API_HOST=`fgrep edge.host= "$WHISKPROPS_FILE" | cut -d'=' -f2`
fi

# Make sure that the api_host is not empty.
: ${API_HOST:?"API_HOST must be set and non-empty"}

# The api host is passed as the third argument. If it is not provided, take "/whisk.system"
# as the default value.
WHISK_NAMESPACE=${3:-"/whisk.system"}

# If the WHISK_NAMESPACE does not start with a forward slash, add it.
if [[ $WHISK_NAMESPACE != \/* ]] ; then
    WHISK_NAMESPACE="/$catalog_namespace"
fi

function addPackageAnnotation() {
    PACKAGE_NAME=$1
    REST=("${@:2}")
    CMD_ARRAY=("$OPENWHISK_HOME/bin/go-cli/wsk" -i --apihost "$API_HOST" package update --auth "$CATALOG_AUTH_KEY" "$WHISK_NAMESPACE/$PACKAGE_NAME" "${REST[@]}")
    export WSK_CONFIG_FILE= # override local property file to avoid namespace clashes
    "${CMD_ARRAY[@]}" &
    PID=$!
    PIDS+=($PID)
    echo "Deprecating package $PACKAGE_NAME"
}

function addActionAnnotation() {
    ACTION_NAME=$1
    REST=("${@:2}")
    CMD_ARRAY=("$OPENWHISK_HOME/bin/go-cli/wsk" -i --apihost "$API_HOST" action update --auth "$CATALOG_AUTH_KEY" --shared yes "$WHISK_NAMESPACE/$ACTION_NAME" "${REST[@]}")
    export WSK_CONFIG_FILE= # override local property file to avoid namespace clashes
    "${CMD_ARRAY[@]}" &
    PID=$!
    PIDS+=($PID)
    echo "Deprecating action $ACTION_NAME"
}

# PIDS is the list of ongoing processes and ERRORS the total number of processes that failed
PIDS=()
ERRORS=0

function waitForAll() {
    for pid in ${PIDS[@]}; do
        wait $pid
        STATUS=$?
        echo "$pid finished with status $STATUS"
        if [ $STATUS -ne 0 ]
        then
            let ERRORS=ERRORS+1
        fi
    done
    PIDS=()
}

echo Deprecating the open catalog package util

addPackageAnnotation util \
    -a deprecated true

echo Deprecating the open catalog action util/cat

addActionAnnotation util/cat \
    -a deprecated true

echo Deprecating the open catalog action util/date

addActionAnnotation util/date \
    -a deprecated true

echo Deprecating the open catalog action util/head

addActionAnnotation util/head \
    -a deprecated true

echo Deprecating the open catalog action util/sort

addActionAnnotation util/sort \
    -a deprecated true

echo Deprecating the open catalog action util/split

addActionAnnotation util/split \
    -a deprecated true

echo Deprecating the open catalog action samples/echo

addActionAnnotation samples/echo \
    -a deprecated truee

waitForAll

exit