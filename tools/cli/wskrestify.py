#
# Copyright 2015-2016 IBM Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import os
import json
import httplib
import urllib
from wskutil import request, responseError, getPrettyJson, parseQName, apiBase, promptRestSpecs, promptParamSpecs, promptTypeSpecs, urlparse, hostBase

def getRestifySpecs(self, args, props):

    #=== Verify action exist ===#
    actions = list(self, args, props)
    valid = False
    if actions['result']:
        for a in actions['result']:
            if a['name'] == args.name:
                valid = True
                break
    if not valid:
        msg = "The requested resource was not found."
        raise Exception(msg)
        return 0

    # === Prompt for Specs ===#
    rest = promptRestSpecs(args)
    rest['apiKey'] = args.auth
    rest['actionName'] = args.name
    rest['verb'] = rest['verb'].lower()
    if rest['route'][0] != '/':
        rest['route'] = '/' + rest['route']
    namespace, pname = parseQName(args.name, props)
    rest['namespace'] = namespace
    rest[
        'targetURL'] = '%(apibase)s/namespaces/%(namespace)s/actions/%(name)s?blocking=%(blocking)s&result=%(result)s' % {
        'apibase': apiBase(props),
        'namespace': urllib.quote(namespace),
        'name': self.getSafeName(pname),
        'blocking': 'true',
        'result': 'true'
    }
    # === Get Param Specs ===#
    if rest['param'] == "Yes":
        restParam = []
        restParamLoop(restParam)
        rest['parameters'] = restParam
    del rest['param']

    #=== Call to Generate Swagger ===#
    swaggerGenUrl = os.environ.get('SWAGGER_ENDPOINT', "http://whisk-swagger-manager.mybluemix.net/api/swaggerDocs/")
    headers = {
        'Content-Type': 'application/json'
    }
    swaggerRes = request('PUT', swaggerGenUrl, getPrettyJson(rest), headers, verbose=args.verbose)
    temp = json.loads(swaggerRes.read())
    swaggerDoc = temp['swaggerDoc']

    # === Call to Micro Gateway ===#
    mgwUrl = os.environ.get('MG_ENDPOINT', hostBase(props) + "/gateway/mgmt/api")
    mgwRes = request('POST', mgwUrl, getPrettyJson(swaggerDoc), headers, verbose=args.verbose)

    mgwTemp = json.loads(mgwRes.read())
    print getPrettyJson(mgwTemp)

    return


# === Helper Functions ===#
def restParamLoop(restParam):
    temp = promptParamSpecs()
    if temp['required'].lower == "true":
        temp['required'] = True
    else:
        temp['required'] = False
    if temp['type'] == "Array":
        tempType = promptTypeSpecs()
        temp['items'] = tempType['type'].lower()

    if temp['another'] == "Yes":
        del temp['another']
        restParam.append(temp)
        return restParamLoop(restParam)
    else:
        del temp['another']
        restParam.append(temp)
        return [restParam]


def list(self, args, props):
    namespace, pname = parseQName(args.name, props)
    if pname:
        pname = ('/%s' % pname) if pname.endswith('/') else '/%s/' % pname
    url = '%(apibase)s/namespaces/%(namespace)s/%(collection)s?skip=%(skip)s&limit=%(limit)s%(public)s' % {
        'apibase': apiBase(props),
        'namespace': urllib.quote(namespace),
        'collection': self.collection,
        'skip': 0,
        'limit': 30,
        'public': '&public=true' if 'shared' in args and args.shared else ''
    }
    res = request('GET', url, auth=args.auth, verbose=args.verbose)

    if res.status == httplib.OK:
        result = json.loads(res.read())
        return {"result" : result}
    else:
        return responseError(res)